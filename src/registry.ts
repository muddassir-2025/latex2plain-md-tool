import { CLIcommand } from "./main.js";
import { commandConvert } from "./commands/convert.js";

export function getCommands(): Record<string,CLIcommand> {
    return {
      convert:{
        name:"convert",
        callback:commandConvert
      }
    }
}