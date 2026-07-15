const RESERVED_IPV6_PREFIXES = ["fc", "fd", "fe8", "fe9", "fea", "feb", "ff", "2001:db8"];
const DOCUMENTATION_IPV4_RANGES = new Set([
  "192.0.2",
  "198.51.100",
  "203.0.113"
]);

export function externalHttpUrlHref(value: string) {
  const href = value.trim();

  if (href.length === 0 || hasMalformedHttpAuthority(href)) {
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
  const embeddedIPv4Address = parseEmbeddedIPv4Address(address);

  if (embeddedIPv4Address) {
    return true;
  }

  return (
    address === "::" ||
    address === "::1" ||
    RESERVED_IPV6_PREFIXES.some((prefix) => address.startsWith(prefix))
  );
}

function parseEmbeddedIPv4Address(address: string) {
  if (address.startsWith("::ffff:")) {
    return parseEmbeddedIPv4AddressSuffix(address.slice("::ffff:".length));
  }

  if (address.startsWith("::")) {
    return parseEmbeddedIPv4AddressSuffix(address.slice("::".length));
  }

  return null;
}

function parseEmbeddedIPv4AddressSuffix(value: string) {
  if (value.length === 0) {
    return null;
  }

  const dottedAddress = parseIPv4Address(value);

  if (dottedAddress) {
    return dottedAddress;
  }

  const hexWords = value.split(":");

  if (hexWords.length !== 2) {
    return null;
  }

  const highWord = parseIPv6HexWord(hexWords[0]);
  const lowWord = parseIPv6HexWord(hexWords[1]);

  if (highWord === null || lowWord === null) {
    return null;
  }

  return [
    highWord >> 8,
    highWord & 0xff,
    lowWord >> 8,
    lowWord & 0xff
  ] as [number, number, number, number];
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

function hasMalformedHttpAuthority(value: string) {
  const lowerValue = value.toLowerCase();

  return (
    hasMissingHttpAuthoritySlashes(lowerValue) ||
    lowerValue.startsWith("http:///") ||
    lowerValue.startsWith("https:///") ||
    lowerValue.startsWith("http://\\") ||
    lowerValue.startsWith("https://\\") ||
    lowerValue.startsWith("http:\\") ||
    lowerValue.startsWith("https:\\") ||
    hasInvalidHttpAuthorityPort(value)
  );
}

function hasInvalidHttpAuthorityPort(value: string) {
  const separatorIndex = value.indexOf("://");

  if (separatorIndex === -1) {
    return false;
  }

  const authorityStart = separatorIndex + "://".length;
  const authorityEnd = findAuthorityEnd(value, authorityStart);
  const authority = value.slice(authorityStart, authorityEnd);
  const hostnameAndPort = authority.slice(authority.lastIndexOf("@") + 1);

  if (hostnameAndPort.startsWith("[")) {
    const closingBracketIndex = hostnameAndPort.indexOf("]");
    const portSuffix = hostnameAndPort.slice(closingBracketIndex + 1);

    return (
      portSuffix.length > 0 &&
      (!portSuffix.startsWith(":") || !isValidPort(portSuffix.slice(1)))
    );
  }

  const colonIndex = hostnameAndPort.lastIndexOf(":");

  return (
    colonIndex !== -1 && !isValidPort(hostnameAndPort.slice(colonIndex + 1))
  );
}

function findAuthorityEnd(value: string, authorityStart: number) {
  for (let index = authorityStart; index < value.length; index += 1) {
    if (value[index] === "/" || value[index] === "?" || value[index] === "#") {
      return index;
    }
  }

  return value.length;
}

function hasMissingHttpAuthoritySlashes(value: string) {
  return (
    (value.startsWith("http:") && !value.startsWith("http://")) ||
    (value.startsWith("https:") && !value.startsWith("https://"))
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
