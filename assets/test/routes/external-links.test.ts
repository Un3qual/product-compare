import { describe, expect, test } from "vitest";
import {
  externalHttpUrlHref,
  externalWebsiteHref
} from "../../src/routes/external-links";

describe("external HTTP URL hrefs", () => {
  test.each([
    [
      "  https://shop.example.com/products/42?ref=compare#details  ",
      "https://shop.example.com/products/42?ref=compare#details"
    ],
    [
      "HTTP://Shop.Example.com:80/products/42",
      "HTTP://Shop.Example.com:80/products/42"
    ],
    [
      "https://shop.example.com:8443/products/42",
      "https://shop.example.com:8443/products/42"
    ],
    ["https://shop.example.com:1", "https://shop.example.com:1"],
    ["https://shop.example.com:65535", "https://shop.example.com:65535"],
    ["https://localhost.example.com", "https://localhost.example.com"],
    ["http://8.8.8.8", "http://8.8.8.8"],
    ["https://100.63.255.255", "https://100.63.255.255"],
    ["https://100.128.0.0", "https://100.128.0.0"],
    ["https://172.15.255.255", "https://172.15.255.255"],
    ["https://172.32.0.0", "https://172.32.0.0"],
    ["https://198.17.255.255", "https://198.17.255.255"],
    ["https://198.20.0.0", "https://198.20.0.0"],
    [
      "https://[2606:4700:4700::1111]:8443/dns",
      "https://[2606:4700:4700::1111]:8443/dns"
    ]
  ])("preserves the trimmed exact safe href %s", (value, expected) => {
    expect(externalHttpUrlHref(value)).toBe(expected);
  });

  test.each([
    "https://user@shop.example.com/product",
    "https://user:secret@shop.example.com/product",
    "https://shop.example.com@evil.example/product"
  ])("rejects credentials in %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "https:shop.example.com/product",
    "https:/shop.example.com/product",
    "https:///shop.example.com/product",
    "https:////shop.example.com/product",
    "https:\\shop.example.com/product",
    "https://\\shop.example.com/product",
    "https://",
    "https://?product=42"
  ])("rejects a malformed HTTP authority in %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "ftp://shop.example.com/product",
    "file:///etc/passwd",
    "mailto:buyer@example.com"
  ])("rejects unsupported scheme %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "https://internal/product",
    "https://-shop.example.com/product",
    "https://shop-.example.com/product",
    "https://shop..example.com/product",
    "https://shop_example.com/product",
    "https://.example.com/product",
    "https://example.com./product"
  ])("rejects invalid external hostname %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "https://shop.example.com:",
    "https://shop.example.com:0/product",
    "https://shop.example.com:65536/product",
    "https://shop.example.com:abc/product"
  ])("rejects invalid port form %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "http://localhost",
    "https://localhost:4000/product",
    "https://catalog.localhost/product"
  ])("rejects localhost destination %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "http://0.0.0.0",
    "http://10.0.0.1",
    "http://100.64.0.1",
    "http://127.0.0.1",
    "http://169.254.1.1",
    "http://172.16.0.1",
    "http://192.0.2.1",
    "http://192.168.1.1",
    "http://198.18.0.1",
    "http://198.51.100.1",
    "http://203.0.113.1",
    "http://224.0.0.1",
    "http://255.255.255.255"
  ])("rejects reserved IPv4 destination %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "http://[::]",
    "http://[::1]",
    "http://[fc00::1]",
    "http://[fd00::1]",
    "http://[fe80::1]",
    "http://[febf::1]",
    "http://[ff02::1]",
    "http://[2001:db8::1]"
  ])("rejects reserved IPv6 destination %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });

  test.each([
    "http://[::ffff:127.0.0.1]",
    "http://[::ffff:8.8.8.8]",
    "http://[::127.0.0.1]",
    "http://[::8.8.8.8]",
    "http://[::ffff:7f00:1]",
    "http://[::ffff:808:808]"
  ])("rejects IPv4-embedded IPv6 destination %s", (value) => {
    expect(externalHttpUrlHref(value)).toBeNull();
  });
});

describe("external website hrefs", () => {
  test.each([
    ["  shop.example.com  ", "https://shop.example.com"],
    ["Shop.Example.com:8443", "https://Shop.Example.com:8443"],
    [" http://shop.example.com/about ", "http://shop.example.com/about"],
    [" https://shop.example.com/about ", "https://shop.example.com/about"]
  ])(
    "promotes a safe bare domain or preserves an absolute href %s",
    (value, expected) => {
      expect(externalWebsiteHref(value)).toBe(expected);
    }
  );

  test.each([
    "",
    "internal",
    "localhost",
    "shop.example.com/path",
    "shop.example.com?ref=compare",
    "shop.example.com#about",
    "user@shop.example.com",
    "shop.example.com:",
    "shop.example.com:0",
    "shop.example.com:65536",
    "shop.example.com:abc",
    "javascript://shop.example.com",
    "https://user@shop.example.com",
    "127.0.0.1",
    "192.168.1.1"
  ])("rejects unsafe or malformed website value %s", (value) => {
    expect(externalWebsiteHref(value)).toBeNull();
  });
});
