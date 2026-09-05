import { readFile, writeFile } from "node:fs/promises";

const configUrl = new URL("../.output/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));

config.name = "ltcme-presale";
config.routes = [
  {
    pattern: "presale.ltcme.click",
    custom_domain: true,
  },
];

await writeFile(configUrl, `${JSON.stringify(config, null, 2)}\n`);
