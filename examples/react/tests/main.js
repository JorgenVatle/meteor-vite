import { describe, expect, it } from 'vitest';

describe("vitetest", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    expect(name).to.equal("vitetest");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      expect(Meteor.isServer).to.equal(false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      expect(Meteor.isClient).to.equal(false);
    });
  }
});
