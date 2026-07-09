declare module "babel-plugin-relay" {
  import type { PluginObj, PluginPass } from "@babel/core";

  const relayPlugin: () => PluginObj<PluginPass>;
  export default relayPlugin;
}
