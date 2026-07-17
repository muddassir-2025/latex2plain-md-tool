import { commandConvert } from "./commands/convert.js";
export function getCommands() {
    return {
        convert: {
            name: "convert",
            callback: commandConvert
        }
    };
}
