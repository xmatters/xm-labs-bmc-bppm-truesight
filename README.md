# BMC ProactiveNet Performance Management and BMC TrueSight
This article provides installation, configuration, and implementation details for integrating xMatters On-Demand with BMC ProactiveNet Performance Management (BPPM) version 9.x.

This integration has also been successfully deployed with BMC TrueSight, the latest version of/successor to BMC BPPM. Additional configuration steps for BMC TrueSight integrations are noted in the text.

# Pre-Requisites
* An account and login information for BPPM (v9.0.5, v9.5 or v9.6)
* Access to the BPPM server to install the xMatters integration agent
* Access to your xMatters On-Demand environment and the ability to create communication plans

# Files
* [ExampleCommPlan.zip](ExampleCommPlan.zip) - This is an example comm plan to help get started. (If it doesn't make sense to have a full communication plan, then you can just use a couple javascript files like the one below.)
* [EmailMessageTemplate.html](EmailMessageTemplate.html) - This is an example HTML template for emails and push messages.
* [FileA.js](FileA.js) - An example javascript file to be pasted into a Shared Library in the Integration builder. Note the comments

# How it works
Add some info here detailing the overall architecture and how the integration works. The more information you can add, the more helpful this sections becomes. For example: An action happens in Application XYZ which triggers the thingamajig to fire a REST API call to the xMatters inbound integration on the imported communication plan. The integration script then parses out the payload and builds an event and passes that to xMatters.

# Installation
Details of the installation go here.

## xMatters set up


## Application ABC set up

# Testing


# Troubleshooting
