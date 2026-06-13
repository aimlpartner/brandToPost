import fs from "fs";

let content = fs.readFileSync("src/components/Sidebar.tsx", "utf8");

content = content.replace(
  /"group flex items-center rounded-xl px-3 py-2\.5 text-sm font-medium transition-all duration-300"/g,
  `"group items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300", item.name !== "Settings" ? "hidden md:flex" : "flex"`
);

fs.writeFileSync("src/components/Sidebar.tsx", content);
