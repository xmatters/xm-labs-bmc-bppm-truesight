
// -----------------------------------------------------------------------------
// runPing
//
// -----------------------------------------------------------------------------
function runPing(destination)
{
    log.debug("Enter - runPing - destination [" + destination + "]")

    if (destination == null)
    {
        throw new IllegalArgumentException("Destination address is null");
    }

    var osNameString = String(System.getProperty( "os.name" )).toLowerCase();
    log.debug("osName [" + osNameString + "]");

    var args = null;

    switch (osNameString)
    {
        case "aix":
        case "sunos":
        case "linux":
            args = [destination, "-c", "1"];
            break;

        case "hp-ux":
            args = [destination];
            break;

        default:
            args = [destination, "-n", "1"];
            break;
    }

    var commandResult = runOsCommand("ping", args);

    var result = null;

    if (commandResult.status == 0)
    {
        result = commandResult.output;
    }
    else
    {
        result = "Request failed. ping command returned status [" + commandResult.status + "]. "
        + "Please contact your BPPM Administrator for assistance";
    }

    log.debug("Result [" + result + "]");
    log.debug("Exit - runPing");
    return result;
}

// -----------------------------------------------------------------------------
// runTraceRoute
//
// -----------------------------------------------------------------------------
function runTraceRoute(destination)
{
    log.debug("Enter - runTraceRoute - destination [" + destination + "]")

    if (destination == null)
    {
        throw new IllegalArgumentException("Destination address is null");
    }

    var osNameString = String(System.getProperty( "os.name" )).toLowerCase();
    log.debug("osName [" + osNameString + "]");

    var command = null;
    var args = null;

    switch (osNameString)
    {
        case "aix":
        case "sunos":
        case "linux":
        case "hp-ux":
            command = "traceroute";
            args = [destination];
            break;

        default:
            command = "tracert";
            args = ["-h", "5", destination];
            break;
    }

    var commandResult = runOsCommand(command, args);

    var result = null;

    if (commandResult.status == 0)
    {
        result = commandResult.output;
    }
    else
    {
        result = "Request failed. " + command + " command returned status [" + commandResult.status + "]. "
        + "Please contact your BPPM Administrator for assistance";
    }

    log.debug("Result [" + result + "]");
    log.debug("Exit - runTraceRoute");

    return result;
}

// -----------------------------------------------------------------------------
// runOsCommand
//
// -----------------------------------------------------------------------------
function runOsCommand(command, args)
{
    log.debug("Enter - runOsCommand");
    log.debug("command [" + command + "]");
    log.debug("args [" + args.toString() + "]");

    // Use an options object to provide args beyond the destination and
    // to return the output and error out.
    var options =
    {
        args: args,
        output: '',
        err: ''
    };

    var commandStatus = runCommand(command, options);

    log.debug("commandStatus [" + commandStatus + "],options.output [" + options.output + "], options.err [" + options.err + "]");

    if (commandStatus != 0)
    {
        log.error("runOsCommand - command [" + command + "] failed with status [" + commandStatus + "]");
        log.error("options.args [" + options.args.toString() + "],options.output [" + options.output + "], options.err [" + options.err + "]");
    }

    // Return the status and output buffers to the caller.
    var result =
    {
        status: commandStatus,
        output: options.output,
        err: options.err
    }

    log.debug("Exit - runOsCommand");

    return result;
}