const fs = require("fs");
const { execSync } = require("child_process");
const archiver = require("archiver");
const { env } = require("process");

const { name, version } = require("./package.json");
const hash = execSync("git rev-parse --short HEAD").toString().trim();

const output = fs.createWriteStream(
  `./build/${name}-${version}+${env.GITHUB_SHA || hash}.zip`,
);

const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`${archive.pointer()} total bytes`);
  console.log(
    "archiver has been finalized and the output file descriptor has closed.",
  );
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

archive.directory("./build/chrome-mv3-prod", false);

archive.finalize();
