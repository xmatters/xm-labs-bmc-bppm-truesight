# BMC ProactiveNet Performance Management and BMC TrueSight
This article provides installation, configuration, and implementation details for integrating xMatters On-Demand with BMC ProactiveNet Performance Management (BPPM) version 9.x. This integration has also been successfully deployed with BMC TrueSight, the latest version of/successor to BMC BPPM. Additional configuration steps for BMC TrueSight integrations are noted in the text.

# Pre-Requisites
* An account and login information for BPPM (v9.0.5, v9.5 or v9.6)
* Access to the BPPM server to install the xMatters integration agent
* Access to your xMatters On-Demand environment and the ability to create communication plans
* A xMatters Integration Agent that is connected to the xMatters OnDemand instance

# Files
* [BMCBPPMIntegration30.zip](BMCBPPMIntegration30.zip) - xMatters Communication Plan
* [bmc-bppm](bmc-bppm) - This folder contains bmc-bppm related files
* [integration-agent](integration-agent) - This folder contains integration agent related files

# How it works
Add some info here detailing the overall architecture and how the integration works. The more information you can add, the more helpful this sections becomes. For example: An action happens in Application XYZ which triggers the thingamajig to fire a REST API call to the xMatters inbound integration on the imported communication plan. The integration script then parses out the payload and builds an event and passes that to xMatters.

# Installation
Details of the installation go here.

## Configure xMatters
The first step in setting up your integration is to configure xMatters.

### Create an integration user
This integration requires a user who can authenticate REST web service calls when injecting events.

This user needs to be able to work with events, but does not need to update administrative settings. While you can use the default Company Supervisor role to authenticate REST web service calls, the best method is to create a user specifically for this integration with the "REST Web Service User" role that includes the required permissions and capabilities.

Note: If you are installing this integration into an xMatters trial instance, you don't need to create a new user. Instead, locate the "Integration User" sample user that was automatically configured with the REST Web Service User role when your instance was created and assign them a new password. You can then skip ahead to the next section.

It is recommended that you use the following formats for the REST API user's User ID:
* **bppm-rest-company-name-np** for your xMatters non-production environment
* **bppm-rest-company-name** for your xMatters production environment.

**To create a REST API user:**
1. Log in to the target xMatters system.
2. On the Users tab, click the Add New User icon.
3. Enter the appropriate information for your new user.
4. Assign the REST Web Service User role to the user.
5. Click Save.
6. On the next page, set the web login ID and password.
7. Make a note of these details; you will need them when configuring other parts of this integration.

### Import the communication plan
The next step is to import the communication plan.

**To import the communication plan:**
1. In the target xMatters system, on the Developer tab, click Import Plan.
2. Click Browse, and then locate the following file within the extracted integration archive:
[BMCBPPMIntegration30.zip](BMCBPPMIntegration30.zip)
3. Click Import Plan.
4. Once the communication plan has been imported, click Plan Disabled to enable the plan.
5. In the Edit drop-down list, select Forms.
6. For the BPPM Incident form, in the Not Deployed drop-down list, click Create Event Web Service.
    * After you create the web service, the drop-down list label will change to Web Service Only.
7. In the Web Service Only drop-down list, click Permissions.
8. Enter the integration user you configured above, and then click Save Changes.

### Permissions

### Accessing Web Service URL's
To get the web service URL for a form, in the Web Service Only drop-down list, click Access Web Service URL. Copy the highlighted URL at the top of the dialog box.

You'll need these URLs when you configure the rest of the integration.

## Configure the Integration Agent
Now that you've configured xMatters On-Demand, it's time to configure the integration agent. This section assumes you have a successfully connected Integration Agent.

Note: In the following instructions, <IAHOME> refers to the installation folder of the integration agent. For example, C:\xMatters\integrationagent

### Install the Integration Package
The installation package contains all that you need to configure the integration.

**To install the package:**
1. Within the extracted integration archive, navigate to: [bmcbppm30](integration-agent/integrationservices)
2. Copy the bmcbppm30 folder to the `<IAHOME>\integrationservices` directory.
3. Open the `<IAHOME>/conf/IAConfig.xml` file and add the following line to the "service-configs" section:
    * `<path>bmcbppm30/bmcbppm.xml</path>`
4. Save and close the file.
5. Open the `configuration.js` file found in the `<IAHOME>\integrationservices\bmcbppm30` folder and add or set the values for the following variables:
| Variable        | Description           |
| ------------- |:-------------:|
| WEB_SERVICE_URL| See [Accessing Web Service URL's](https://github.com/matthewhenry1/xm-labs-bmc-bppm-truesight#accessing-web-service-urls)|
| col 2 is      | centered      |
| zebra stripes | are neat      |



## BMC BPPM and BMC TrueSight
BPPM v9.5 and v9.6 require a known workaround from BMC, which has been documented here: BMC Knowledge Base article.

If you are integrating with BMC TrueSight, you will also need to ensure that the BMC Impact Integration Web Services product is installed on your deployment. This is a BPPM component, and may not be included in a TrueSight installation, but it is compatible with TrueSight and is a required target for this integration.


# Testing


# Troubleshooting
