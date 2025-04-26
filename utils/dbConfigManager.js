const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../dbConfigs.json');

function getAllConfigs() {
    if (!fs.existsSync(configPath)) return {};
    const file = fs.readFileSync(configPath);
    return JSON.parse(file);
}

function getConfigForDomain(domain) {
    const configs = getAllConfigs();
    return configs[domain];
}

function saveConfigForDomain(domain, config) {
    const configs = getAllConfigs();
    configs[domain] = config;
    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
}

module.exports = { getConfigForDomain, saveConfigForDomain };
