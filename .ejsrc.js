const { join } = require("path");
const { readFileSync } = require("fs");

module.exports = {
  template(include, name, locals) {
    return `<template id="${name}_template">${include(join(__dirname, "/src/html/sheet/templates/", name), locals)}</template>`;
  },
  svg(include, name) {
    return include(join(__dirname, "/assets/", name + ".svg"));
    // .match(/(<svg(?:.|\n)*<\/svg>)(?:\s|\n)*$/)[1];
  },
};
