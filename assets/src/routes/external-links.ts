export function externalHttpUrlHref(value: string) {
  const href = value.trim();

  if (href.length === 0 || hasMalformedHttpAuthority(href)) {
    return null;
  }

  try {
    const url = new URL(href);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.hostname.length === 0 ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      !isValidHostname(url.hostname)
    ) {
      return null;
    }

    return href;
  } catch {
    return null;
  }
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
    lowerValue.startsWith("http:///") ||
    lowerValue.startsWith("https:///") ||
    lowerValue.startsWith("http://\\") ||
    lowerValue.startsWith("https://\\") ||
    lowerValue.startsWith("http:\\") ||
    lowerValue.startsWith("https:\\")
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

  return hostname.split(".").every(isValidHostnameLabel);
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
