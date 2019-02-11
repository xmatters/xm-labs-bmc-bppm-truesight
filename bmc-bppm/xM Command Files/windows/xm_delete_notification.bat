rem xMatters Integration for BMC ProactiveNet Performance Management
rem To delete an xMatters event inject into the Integration Agent with status "CLOSED"

rem echo %date%, %time%: %0 running with parameters [%1] [%mc_ueid%] [%status%] [%severity%] [%mc_priority%] [%date_reception%] >> xMatters.log

"C:\xmatters\integrationagent\bin\APClient.bin.exe" --map-data "applications|bmcbppm30" "%1" %mc_ueid% "%severity%" "CLOSED" "%mc_priority%" "%date_reception%" "%CELL_NAME%" "%mc_host_address%" "%mc_client_address%" "%mc_host%" "%mc_object%" "%mc_object_class%" "%mc_parameter%" "%mc_tool%" "%mc_tool_class%" "%mc_smc_causes%" "%mc_smc_effects%" "%msg%"