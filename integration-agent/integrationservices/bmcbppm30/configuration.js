// ----------------------------------------------------------------------------------------------------
// Configuration settings for the xMatters Communication Plan REST Integration with BMC BPPM
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// This value determines the form that will be used to inject events into xMatters if no form parameter
// is present in the request. The retrieve or terminate event requests are also based on this URL
// ----------------------------------------------------------------------------------------------------
var WEB_SERVICE_URL = "https://<customer>.<environment>.xmatters.com/api/integration/1/functions/589ba478-f772-47b9-9845-3743ced100fe/triggers";

// *****************************************************************************
// This variable must be changed when the integration is installed.
// Name of the BPPM cell being integrated with. Referred to as $CELL in the
// integration manual
var BPPM_CELL = "BPPM_CELL_NAME";
// *****************************************************************************

// -----------------------------------------------------------------------------
// Constants used by the BMC Impact Integration Web services.
// -----------------------------------------------------------------------------
// IMWS Web Service Endpoint
var IIWS_URL = "http://localhost:9080/imws/services/ImpactManager";

// ----------------------------------------------------------------------------------------------------
// IMWS Web Service Endpoint and Credentials
// These are not used and can be left blank
// ----------------------------------------------------------------------------------------------------
var IIWS_USERNAME = "";
var IIWS_PASSWORD = "";

// ----------------------------------------------------------------------------------------------------
// Buffer type used when creating a connection to IMWS.
// See ImapiTypes.xsd and the Developer Guide for other buffer modes.
// ----------------------------------------------------------------------------------------------------
var IIWS_BUFFER_TYPE = "BMCII_BUFFER_MODE_DEFAULT";

// ----------------------------------------------------------------------------------------------------
// Timeout values for IMWS operations in mS.
// ----------------------------------------------------------------------------------------------------
var IIWS_SEND_EVENT_TIMEOUT = "3000"
var IIWS_RETRIEVE_QUERY_RESULTS_TIMEOUT = "3000"

// ----------------------------------------------------------------------------------------------------
// Used for the <subject> element of IMWS SendEvent messages
// ----------------------------------------------------------------------------------------------------
var IIWS_SEND_EVENT_SUBJECT = "AXIS Client Events";

// ----------------------------------------------------------------------------------------------------
// The username and password used to authenticate the request to xMatters.
// The PASSWORD value is a path to a file where the
// user's password should be encrypted using the iapassword.sh utility.
// Please see the integration agent documentation for instructions.
// ----------------------------------------------------------------------------------------------------
INITIATOR = "bppm-rest-<company>";
PASSWORD = "integrationservices/bmcbppm30/.initiatorpasswd";

// ----------------------------------------------------------------------------------------------------
// Callbacks requested for this integration service.
// ----------------------------------------------------------------------------------------------------
CALLBACKS = ["status", "deliveryStatus", "response"];

// ----------------------------------------------------------------------------------------------------
// Filter to use in <IAHOME>/conf/deduplicator-filter.xml
// ----------------------------------------------------------------------------------------------------
DEDUPLICATION_FILTER_NAME = "bmcbppm30";

// ----------------------------------------------------------------------------------------------------
// Sends a delete prior to creating the new event to clear out any existing events for this Incident ID
// ----------------------------------------------------------------------------------------------------
var DELETE_EXISTING_EVENTS = true;

// ----------------------------------------------------------------------------------------------------
// Update BMC BPPM events with xMatters notification delivery status.
// ----------------------------------------------------------------------------------------------------
var ANNOTATE_DELIVERY = true;

// ----------------------------------------------------------------------------------------------------
// Map BPPM Priority ("priority") OR BPPM Severity ("severity") OR no priority ("none") to
// xMatters Priority levels (Low, Medium, High)
// ----------------------------------------------------------------------------------------------------
var MAP_XM_PRIORITY = "severity";

// ----------------------------------------------------------------------------------------------------
// Identify global values for comment prefix and users
// ----------------------------------------------------------------------------------------------------
var NOTE_PREFIX = "[xMatters] - "; // The Prefix which is added to the note comments e.g. "[xMatters] - "
var CALLOUT_USER = "xMatters"; // Username associated with callout annotations
var TOKEN_NAME_DIAGNOSTIC_RESPONSE = "diagnostic_response";

// ----------------------------------------------------------------------------------------------------
// URL for REST web service calls
// ----------------------------------------------------------------------------------------------------
REST_SERVICE_URL = "https://<company>.<environment>.xmatters.com/api/xm/1/";

/**
 * A global logger for any js files that aren't class definitions using WSUtil as a super-class
 */
var log = new Logger();
