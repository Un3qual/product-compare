const DOCUMENTATION_IPV4_RANGES = new Set([
  "192.0.2",
  "198.51.100",
  "203.0.113"
]);
const BLOCKED_IPV6_PREFIXES = [
  // IPv4-compatible, mapped, and translatable address forms.
  {
    prefix: [0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000],
    bits: 96
  },
  {
    prefix: [0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0xffff],
    bits: 96
  },
  {
    prefix: [0x0000, 0x0000, 0x0000, 0x0000, 0xffff, 0x0000],
    bits: 96
  },
  // NAT64 well-known and local-use translation prefixes.
  {
    prefix: [0x0064, 0xff9b, 0x0000, 0x0000, 0x0000, 0x0000],
    bits: 96
  },
  { prefix: [0x0064, 0xff9b, 0x0001], bits: 48 },
  // 6to4 and Teredo carry IPv4 routing information in canonical IPv6 words.
  { prefix: [0x2002], bits: 16 },
  { prefix: [0x2001, 0x0000], bits: 32 },
  // Unique-local, link-local, multicast, and documentation ranges.
  { prefix: [0xfc00], bits: 7 },
  { prefix: [0xfe80], bits: 10 },
  { prefix: [0xff00], bits: 8 },
  { prefix: [0x2001, 0x0db8], bits: 32 }
] as const;

export function externalHttpUrlHref(value: string) {
  const href = value.trim();
  const rawAuthority = parseRawHttpAuthority(href);

  if (!rawAuthority || hasDottedIPv4Tail(rawAuthority.hostname)) {
    return null;
  }

  const url = parseUrl(href);

  return url && isSafeExternalHttpUrl(url) ? href : null;
}

export function externalWebsiteHref(value: string) {
  const domain = value.trim();

  if (domain.length === 0) {
    return null;
  }

  if (hasAbsoluteUrlScheme(domain)) {
    return externalHttpUrlHref(domain);
  }

  if (!isHostnameShapedBareDomain(domain)) {
    return null;
  }

  return externalHttpUrlHref(`https://${domain}`);
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isSafeExternalHttpUrl(url: URL) {
  return (
    isHttpProtocol(url.protocol) &&
    url.hostname.length > 0 &&
    url.username.length === 0 &&
    url.password.length === 0 &&
    isValidHostname(url.hostname) &&
    isPublicHostname(url.hostname)
  );
}

function isHttpProtocol(protocol: string) {
  return protocol === "http:" || protocol === "https:";
}

function isPublicHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    !isLocalhostHostname(normalizedHostname) &&
    !isReservedIpHostname(normalizedHostname)
  );
}

function isLocalhostHostname(hostname: string) {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

function isReservedIpHostname(hostname: string) {
  const ipv4Address = parseIPv4Address(hostname);

  if (ipv4Address) {
    return isReservedIPv4Address(ipv4Address);
  }

  const ipv6Address = parseBracketedIPv6Address(hostname);

  return ipv6Address ? isReservedIPv6Address(ipv6Address) : false;
}

function parseIPv4Address(hostname: string) {
  const octets = hostname.split(".");

  if (octets.length !== 4) {
    return null;
  }

  const parsedOctets: number[] = [];

  for (const octet of octets) {
    const parsedOctet = parseIPv4Octet(octet);

    if (parsedOctet === null) {
      return null;
    }

    parsedOctets.push(parsedOctet);
  }

  return parsedOctets as [number, number, number, number];
}

function parseIPv4Octet(value: string) {
  if (value.length === 0 || value.length > 3) {
    return null;
  }

  for (const character of value) {
    if (!isDigit(character)) {
      return null;
    }
  }

  const octet = Number(value);

  return octet <= 255 ? octet : null;
}

function isReservedIPv4Address([first, second, third]: [
  number,
  number,
  number,
  number
]) {
  return (
    isReservedFirstIPv4Octet(first) ||
    isPrivateIPv4Range(first, second) ||
    isSharedAddressSpace(first, second) ||
    isLinkLocalIPv4Range(first, second) ||
    isDocumentationIPv4Range(first, second, third) ||
    isBenchmarkIPv4Range(first, second)
  );
}

function isReservedFirstIPv4Octet(octet: number) {
  return octet === 0 || octet === 127 || octet >= 224;
}

function isPrivateIPv4Range(first: number, second: number) {
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isSharedAddressSpace(first: number, second: number) {
  return first === 100 && second >= 64 && second <= 127;
}

function isLinkLocalIPv4Range(first: number, second: number) {
  return first === 169 && second === 254;
}

function isDocumentationIPv4Range(first: number, second: number, third: number) {
  return DOCUMENTATION_IPV4_RANGES.has(`${first}.${second}.${third}`);
}

function isBenchmarkIPv4Range(first: number, second: number) {
  return first === 198 && (second === 18 || second === 19);
}

function parseBracketedIPv6Address(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : null;
}

function isReservedIPv6Address(address: string) {
  const words = parseIPv6AddressWords(address);

  if (!words) {
    return true;
  }

  return BLOCKED_IPV6_PREFIXES.some(({ prefix, bits }) =>
    matchesIPv6Prefix(words, prefix, bits)
  );
}

function parseIPv6AddressWords(address: string) {
  const compressionIndex = address.indexOf("::");

  if (
    compressionIndex !== -1 &&
    address.indexOf("::", compressionIndex + 2) !== -1
  ) {
    return null;
  }

  if (compressionIndex === -1) {
    const words = parseIPv6WordSequence(address);

    return words?.length === 8 ? words : null;
  }

  const leadingWords = parseIPv6WordSequence(
    address.slice(0, compressionIndex)
  );
  const trailingWords = parseIPv6WordSequence(
    address.slice(compressionIndex + 2)
  );

  if (!leadingWords || !trailingWords) {
    return null;
  }

  const omittedWordCount = 8 - leadingWords.length - trailingWords.length;

  if (omittedWordCount < 1) {
    return null;
  }

  return [
    ...leadingWords,
    ...Array.from({ length: omittedWordCount }, () => 0),
    ...trailingWords
  ];
}

function parseIPv6WordSequence(value: string) {
  if (value.length === 0) {
    return [];
  }

  const words: number[] = [];

  for (const valueWord of value.split(":")) {
    const word = parseIPv6HexWord(valueWord);

    if (word === null) {
      return null;
    }

    words.push(word);
  }

  return words;
}

function matchesIPv6Prefix(
  address: number[],
  prefix: readonly number[],
  prefixLength: number
) {
  const completeWords = Math.floor(prefixLength / 16);

  for (let index = 0; index < completeWords; index += 1) {
    if (address[index] !== prefix[index]) {
      return false;
    }
  }

  const remainingBits = prefixLength % 16;

  if (remainingBits === 0) {
    return true;
  }

  const mask = (0xffff << (16 - remainingBits)) & 0xffff;

  return (address[completeWords] & mask) === (prefix[completeWords] & mask);
}

function parseIPv6HexWord(value: string) {
  if (value.length === 0 || value.length > 4) {
    return null;
  }

  for (const character of value) {
    if (!isHexDigit(character)) {
      return null;
    }
  }

  const word = Number.parseInt(value, 16);

  return word <= 0xffff ? word : null;
}

function hasAbsoluteUrlScheme(value: string) {
  const separatorIndex = value.indexOf("://");

  if (separatorIndex <= 0) {
    return false;
  }

  for (let index = 0; index < separatorIndex; index += 1) {
    if (!isSchemeCharacter(value[index], index)) {
      return false;
    }
  }

  return true;
}

function parseRawHttpAuthority(value: string) {
  const separatorIndex = value.indexOf("://");

  if (
    separatorIndex === -1 ||
    !isRawHttpProtocol(value.slice(0, separatorIndex))
  ) {
    return null;
  }

  const authorityStart = separatorIndex + "://".length;
  const authorityEnd = findStrictAuthorityEnd(value, authorityStart);

  if (authorityEnd === null) {
    return null;
  }

  const authority = value.slice(authorityStart, authorityEnd);

  if (authority.length === 0 || authority.includes("@")) {
    return null;
  }

  return parseRawHostnameAndPort(authority);
}

function isRawHttpProtocol(value: string) {
  const protocol = value.toLowerCase();

  return protocol === "http" || protocol === "https";
}

function findStrictAuthorityEnd(value: string, authorityStart: number) {
  for (let index = authorityStart; index < value.length; index += 1) {
    if (isForbiddenRawAuthorityCharacter(value[index])) {
      return null;
    }

    if (value[index] === "/" || value[index] === "?" || value[index] === "#") {
      return index;
    }
  }

  return value.length;
}

function isForbiddenRawAuthorityCharacter(character: string) {
  const codePoint = character.charCodeAt(0);

  return character === "\\" || codePoint <= 0x20 || codePoint === 0x7f;
}

function parseRawHostnameAndPort(authority: string) {
  if (authority.startsWith("[")) {
    return parseRawBracketedHostnameAndPort(authority);
  }

  if (authority.includes("[") || authority.includes("]")) {
    return null;
  }

  const colonIndex = authority.lastIndexOf(":");

  if (colonIndex === -1) {
    return { hostname: authority };
  }

  if (
    authority.indexOf(":") !== colonIndex ||
    !isValidPort(authority.slice(colonIndex + 1))
  ) {
    return null;
  }

  const hostname = authority.slice(0, colonIndex);

  return hostname.length > 0 ? { hostname } : null;
}

function parseRawBracketedHostnameAndPort(authority: string) {
  const closingBracketIndex = authority.indexOf("]");

  if (closingBracketIndex <= 1) {
    return null;
  }

  const hostname = authority.slice(0, closingBracketIndex + 1);
  const portSuffix = authority.slice(closingBracketIndex + 1);

  if (portSuffix.length === 0) {
    return { hostname };
  }

  if (!portSuffix.startsWith(":") || !isValidPort(portSuffix.slice(1))) {
    return null;
  }

  return { hostname };
}

function hasDottedIPv4Tail(hostname: string) {
  return (
    hostname.startsWith("[") &&
    hostname.endsWith("]") &&
    hostname.includes(".")
  );
}

function isHostnameShapedBareDomain(value: string) {
  if (
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("@") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return false;
  }

  const parsedDomain = parseBareDomain(value);

  if (!parsedDomain) {
    return false;
  }

  const labels = parsedDomain.hostname.split(".");

  return labels.length >= 2 && labels.every(isValidHostnameLabel);
}

function parseBareDomain(value: string) {
  const colonIndex = value.lastIndexOf(":");

  if (colonIndex === -1) {
    return { hostname: value };
  }

  if (value.indexOf(":") !== colonIndex) {
    return null;
  }

  const hostname = value.slice(0, colonIndex);
  const port = value.slice(colonIndex + 1);

  if (!isValidPort(port)) {
    return null;
  }

  return { hostname };
}

function isValidHostname(hostname: string) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return true;
  }

  const labels = hostname.split(".");

  return labels.length >= 2 && labels.every(isValidHostnameLabel);
}

function isValidHostnameLabel(label: string) {
  if (
    label.length === 0 ||
    label.length > 63 ||
    label.startsWith("-") ||
    label.endsWith("-")
  ) {
    return false;
  }

  for (const character of label) {
    if (!isAsciiLetterOrDigit(character) && character !== "-") {
      return false;
    }
  }

  return true;
}

function isValidPort(port: string) {
  if (port.length === 0 || port.length > 5) {
    return false;
  }

  for (const character of port) {
    if (!isDigit(character)) {
      return false;
    }
  }

  const portNumber = Number(port);

  return portNumber > 0 && portNumber <= 65_535;
}

function isSchemeCharacter(character: string, index: number) {
  if (index === 0) {
    return isAsciiLetter(character);
  }

  return (
    isAsciiLetter(character) ||
    isDigit(character) ||
    character === "+" ||
    character === "." ||
    character === "-"
  );
}

function isAsciiLetterOrDigit(character: string) {
  return isAsciiLetter(character) || isDigit(character);
}

function isAsciiLetter(character: string) {
  const codePoint = character.charCodeAt(0);

  return (
    (codePoint >= "A".charCodeAt(0) && codePoint <= "Z".charCodeAt(0)) ||
    (codePoint >= "a".charCodeAt(0) && codePoint <= "z".charCodeAt(0))
  );
}

function isDigit(character: string) {
  const codePoint = character.charCodeAt(0);

  return codePoint >= "0".charCodeAt(0) && codePoint <= "9".charCodeAt(0);
}

function isHexDigit(character: string) {
  return (
    isDigit(character) ||
    (character >= "a" && character <= "f") ||
    (character >= "A" && character <= "F")
  );
}
