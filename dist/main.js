import { getCommands } from "./registry.js";
const commands = getCommands();
const args = process.argv.slice(2);
const cmdName = args[0];
const cmdArg = args.slice(1); //an array of arguments
if (!cmdName) {
    console.log("not enough arguments");
    process.exit(1);
}
if (!cmdArg) {
    console.log("filename is required");
    process.exit(1);
}
//pass command to funct containing all commands
const command = commands[cmdName];
if (command) {
    await command.callback(...cmdArg);
    process.exit(0);
}
else {
    console.log("Unknown command");
    process.exit(1);
}
