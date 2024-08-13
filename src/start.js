const fs = require("fs");
const path = require("path");


const projectRootPathJsconfig = path.resolve(__dirname, "../../../");
const jsconfigFilePath = path.join(projectRootPathJsconfig, "jsconfig.json");
try{
  const contentTsConfig = `{
    "compilerOptions": {
      // "target": "ES6",
      //"module": "commonjs",
      //"lib": ["es6", "dom"],
      // "baseUrl": "./",
      // "paths": {
      //   "@/*": ["./path/to/aliases/*"]
      // },
      "types": ["cypress"]
    },
    // "include": ["**/*"],
    "exclude": ["node_modules"]
    }
    `;
    
    fs.writeFileSync(jsconfigFilePath, contentTsConfig);
} catch (error) {
  console.error("Erro ao criar o arquivo jsconfig.json:", error);
}
