// -----------------------------------------------------------------------------
// xMatters Integration for BMC ProactiveNet Performance Management
//
// Main JavaScript file for the integration
// -----------------------------------------------------------------------------

importPackage(java.lang);
importPackage(java.util);
importPackage(java.io);
importPackage(java.text);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessage);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLToken);
importClass(Packages.com.alarmpoint.integrationagent.util.EventDeduplicator);
importClass(Packages.com.thoughtworks.xstream.XStream);
importClass(Packages.com.thoughtworks.xstream.converters.reflection.PureJavaReflectionProvider);

var xStream = new XStream(new PureJavaReflectionProvider())

var INT_VERSION = "30";

// Core Javascript files provided by the IA
load("lib/integrationservices/javascript/event.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/lib/javascript/core/baseclass.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/lib/javascript/core/logger.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/lib/javascript/webservices/wsutil.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/lib/javascript/webservices/soapfault.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/lib/javascript/xmatters/xmattersws.js");

// Integration-specific JS files
load("integrationservices/bmcbppm" + INT_VERSION + "/configuration.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/imws.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/bppmws.js");
load("integrationservices/bmcbppm" + INT_VERSION + "/oscommand.js");

var NO_ASSIGNEE = null;
var NO_LOGS = null;
var NO_NOTES = null;

function apia_event(form) {
  // APClient.bin injection has been converted to a JavaScript object
  IALOG.debug("**** apia_event():");

  // Assign recipients to JSON property recipients and target_group
  var recipients = new String(form.recipients);
  form.recipients = [{
    "targetName": recipients
  }];
  form.properties.target_group = recipients;
  IALOG.info("recipients: " + recipients);

  // If status of BPPM incident is CLOSED then terminate xMatters event and exit
  if (form.properties.status == "CLOSED") {
    IALOG.info("incident_id to be terminated: " + form.properties.incident_id);
    terminateEventByIncident(form.properties.incident_id);
    return;
  }

  // If existing events for same BPPM incident should be terminated, terminate them first then continue to add event.
  if (DELETE_EXISTING_EVENTS) {
    IALOG.info("incident_id to be terminated: " + form.properties.incident_id);
    terminateEventByIncident(form.properties.incident_id);
  }

  // Enrich with the creation timestamp slot from BPPM.
  // NOTE:
  // 1) Date must be converted to a string; otherwise, it gets wrapped
  // in a JavaScript envelope whose toString() method returns an
  // object identifier.
  //
  // 2) the date_reception slot from BPPM is in EPOC time (seconds)

  var msEpochTimestampSec = form.properties.date_reception;
  var msEpochTimestampMilli = msEpochTimestampSec * 1000;
  var eventDateTime = new Date(msEpochTimestampMilli);
  var eventDateTimeStr = new String(eventDateTime.toString());

  form.properties.bppm_epoch_timestamp_ms = msEpochTimestampMilli;
  form.properties.bppm_event_time = eventDateTimeStr;
  delete form.properties['date_reception'];

  // Split eventDateTime for use in voice messages
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  form.properties.eventCreateDate = eventDateTime.getDate();
  form.properties.eventCreateDay = days[eventDateTime.getDay()];
  form.properties.eventCreateMonth = months[eventDateTime.getMonth()];
  form.properties.eventCreateMinute = eventDateTime.getMinutes();

  // Convert 24H to 12H AM/PM
  var eventHH = eventDateTime.getHours();
  var eventAMPM = "AM";
  var eventHour = eventHH;
  if (eventHour > 12) {
    eventHour = eventHH - 12;
    eventAMPM = "PM";
  }
  if (eventHour == 0) {
    eventHour = 12;
  }
  form.properties.eventCreateHour = eventHour;
  form.properties.eventCreateAMPM = eventAMPM;

  // Map BPPM Priority OR Severity to xMatters Priority levels (Low, Medium, High)
  var bppmSeverity = form.properties.severity;
  if (MAP_XM_PRIORITY == "severity") {
    if (bppmSeverity == "UNKNOWN" || bppmSeverity == "OK" || bppmSeverity == "INFO") {
      form.priority = "low";
    } else if (bppmSeverity == "WARNING" || bppmSeverity == "MINOR") {
      form.priority = "medium";
    } else if (bppmSeverity == "MAJOR" || bppmSeverity == "CRITICAL") {
      form.priority = "high";
    } else {
      IALOG.info("Unknown BPPM Severity. xMatters Communication Plan Form default Priority will be used.");
    }
  }

  var bppmPriority = form.properties.mc_priority;
  if (MAP_XM_PRIORITY == "priority") {
    if (bppmPriority == "PRIORITY_4" || bppmPriority == "PRIORITY_5") {
      form.priority = "low";
    } else if (bppmPriority == "PRIORITY_2" || bppmPriority == "PRIORITY_3") {
      form.priority = "medium";
    } else if (bppmPriority == "PRIORITY_1") {
      form.priority = "high";
    } else {
      IALOG.info("Unknown BPPM Priority. xMatters Communication Plan Form default Priority will be used.");
    }
  }

  IALOG.info(NOTE_PREFIX + "Notification will be sent to [" + recipients + "].");

  return form;
}

function apia_callback(msg) {
  var str = "Received message from xMatters:\n";
  str += "Incident: " + msg.additionalTokens.incident_id;
  str += "\nEvent Id: " + msg.eventidentifier;
  str += "\nCallback Type: " + msg.xmatters_callback_type;
  IALOG.info(str);

  var msgJSON = JSON.stringify(msg);
  IALOG.info(msgJSON);

  if (msg.xmatters_callback_type == "status") {
    handleStatusCallback(msg)
  } else if (msg.xmatters_callback_type == "response") {
    handleResponseCallback(msg)
  } else if (msg.xmatters_callback_type == "deliveryStatus") {
    handleDeliveryStatusCallback(msg)
  } else {
    IALOG.error("Unknown or unspecified callback type: " + msg.xmatters_callback_type);
  }
  IALOG.debug("Exit - apia_callback");

  return;
}

/**
 * -----------------------------------------------------------------------------
 * handleResponseCallback
 *
 * Handles the Response Callback. The response callback is returned when the
 * event receives a response.
 *
 * -----------------------------------------------------------------------------
 */
function handleResponseCallback(msg) {
  IALOG.debug("Enter - handleResponseCallback. Handling response [" + msg.response + "] for event [" + msg.additionalTokens.incident_id + "]");

  var incidentId = msg.additionalTokens.incident_id;
  var responder = msg.recipient;

  var annotation = "";
  var logAnnotation = "";
  var msgAnnotation = "";

  var isRepliedFromXM = true;

  var bppmws = new BPPMWS();

  switch ((msg.response).toLowerCase()) {
    case "acknowledge":
      logAnnotation = NOTE_PREFIX + "Event acknowledged by " + responder;
      bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_ACKNOWLEDGE, NO_ASSIGNEE, responder, logAnnotation, NO_NOTES, isRepliedFromXM);
      break;

    case "close":
      logAnnotation = NOTE_PREFIX + "Event closed by " + responder;
      bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_CLOSED, NO_ASSIGNEE, responder, logAnnotation, NO_NOTES, isRepliedFromXM);
      break;

    case "accept":
      logAnnotation = NOTE_PREFIX + "Event accepted by " + responder;
      bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_NONE, responder, responder, logAnnotation, NO_NOTES, isRepliedFromXM);
      break;

    case "ignore":
      logAnnotation = NOTE_PREFIX + "Event ignored by " + responder;
      bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_NONE, NO_ASSIGNEE, responder, logAnnotation, NO_NOTES, isRepliedFromXM);
      break;

    case "ping mchostaddress":
      responseToXM.setToken(TOKEN_NAME_DIAGNOSTIC_RESPONSE,
        StringEscapeUtils.escapeXml(runPing(msg.additionalTokens.host_address)),
        APXMLToken.Type.STRING);
      break;

    case "ping eventorigin":
      responseToXM.setToken(TOKEN_NAME_DIAGNOSTIC_RESPONSE,
        StringEscapeUtils.escapeXml(runPing(msg.additionalTokens.client_address)),
        APXMLToken.Type.STRING);
      break;

    case "traceroute mchostaddress":
      responseToXM.setToken(TOKEN_NAME_DIAGNOSTIC_RESPONSE,
        StringEscapeUtils.escapeXml(runTraceRoute(msg.additionalTokens.host_address)),
        APXMLToken.Type.STRING);
      break;

    case "traceroute eventorigin":
      responseToXM.setToken(TOKEN_NAME_DIAGNOSTIC_RESPONSE,
        StringEscapeUtils.escapeXml(runTraceRoute(msg.additionalTokens.client_address)),
        APXMLToken.Type.STRING);
      break;

    default:
      throw "Unknown response Action: " + responseAction;
      break;
  }

  // Add annotation if present
  if (msg.annotation != null && msg.annotation != "null") {
    msgAnnotation = NOTE_PREFIX + msg.annotation;
    bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_NONE, NO_ASSIGNEE, responder, NO_LOGS, msgAnnotation, false);
  }

  IALOG.debug("Exit - handleResponseAction");
}

/**
 * -----------------------------------------------------------------------------
 * handleDeliveryStatusCallback
 *
 * Handles the Delivery Status Callback. The delivery status callback is returned
 * when the notification deliveries are processed.
 *
 * -----------------------------------------------------------------------------
 */
function handleDeliveryStatusCallback(msg) {
  IALOG.debug("Enter - handleDeliveryStatusCallback");

  var incidentId = msg.additionalTokens.incident_id;
  var responder = msg.recipient;
  var xmDeliveryStatus = msg.deliverystatus;
  var xmDevice = msg.device;

  // Create an annotation for the successful or failed delivery of a notification.
  var annotation = "";
  annotation = xmDeliveryStatus + " to " + responder + " | " + xmDevice;

  if (!ANNOTATE_DELIVERY) {
    IALOG.warn("Delivery annotations are suppressed - the following message will not be annotated to BPPM event: [" + incidentId + "] " + annotation);
    return;
  }

  IALOG.debug("Starting call to management system for delivery status annotation for BPPM event: [" + incidentId + "]");

  try {
    var bppmws = new BPPMWS();

    var result = bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_NONE, NO_ASSIGNEE, CALLOUT_USER, NO_LOGS, NOTE_PREFIX + annotation, false);

    IALOG.debug("Finished call to management system for delivery status annotation for BPPM event: [" + incidentId + "] with result " + result);
  } catch (e) {
    IALOG.error("Caught exception processing delivery status annotation for BPPM event: [" + incidentId + "] Exception:" + e);
    throw e;
  }
  IALOG.debug("Exit - handleDeliveryStatusCallback");
}

/**
 * -----------------------------------------------------------------------------
 * handleStatusCallback
 *
 * Handles the Status Callback. The status callback is returned for all event
 * updates.
 *
 * -----------------------------------------------------------------------------
 */
function handleStatusCallback(msg) {
  IALOG.debug("Enter - handleStatusCallback");

  var incidentId = msg.additionalTokens.incident_id;
  var xmStatus = msg.status;

  // Create an annotation for xMatters Event status updates.
  var annotation = "";
  annotation = "xMatters incident for BPPM event: " + incidentId + " | " + xmStatus;

  IALOG.debug("Starting call to management system for status annotation for BPPM event: [" + incidentId + "]");

  try {
    var bppmws = new BPPMWS();

    var result = bppmws.updateEvent(incidentId, bppmws.IMWS_STATUS_NONE, NO_ASSIGNEE, CALLOUT_USER, NO_LOGS, NOTE_PREFIX + annotation, false);

    IALOG.debug("Finished call to management system for status annotation for BPPM event: [" + incidentId + "] with result " + result);
  } catch (e) {
    IALOG.error("Caught exception processing status annotation for BPPM event: [" + incidentId + "] Exception:" + e);
    throw e;
  }
  IALOG.debug("Exit - handleStatusCallback");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * terminateEventByIncident
 *
 * Parse value from xml node by first identifying 'name' element
 * then locating next 'value' element
 *
 * @input xml string, key value
 * @retun value
 * ---------------------------------------------------------------------------------------------------------------------
 */
function terminateEventByIncident(incident_id) {
  try {

    // Get event by incident_id property
    var response = XMIO.get(REST_SERVICE_URL + "/events?status=ACTIVE&propertyName=incident_id%23en&propertyValue=" + incident_id);

    var events = JSON.parse(response.body);
    var total = parseInt(events.total);
  } catch (err) {
    IALOG.error("terminateEventByIncident - Error querying xMOD for incident_id: " + incident_id + " (message): " + err.message);
    IALOG.error("terminateEventByIncident - Error querying xMOD for incident_id: " + incident_id + " (stack): " + err.stack);
  }

  if (total > 0) {

    IALOG.info("terminateEventByIncident - Found record for termination!");
    var termEvents = 0;
    while (total > termEvents) {

      // Event ID and URL
      var termEventID = events.data[termEvents].id.toString();
      var termURL = REST_SERVICE_URL + "events";

      // Terminate event
      try {
        response = XMIO.post(JSON.stringify({
          id:termEventID,
          status: 'TERMINATED'
        }), termURL);
        IALOG.info("RESPONSE CODE " + response.status)
        if (response.status >= 200 && response.status <= 299) {
          IALOG.info("terminateEventByIncident - Event associated with incident_id '" + incident_id + "' has been terminated.")
        } else {
          IALOG.warn("terminateEventByIncident - Event associated with incident_id '" + incident_id + "' has failed to terminate.")
          IALOG.debug("terminateEventByIncident - response.status: " + response.status.toString())
        }
      } catch (err) {
        IALOG.error("terminateEventByIncident - Error terminating xMOD for incident_id: " + incident_id + " (message): " + err.message);
        IALOG.error("terminateEventByIncident - Error terminating xMOD for incident_id: " + incident_id + " (stack): " + err.stack);
      }

      // Increment
      termEvents++;
    }
  } else if (total == 0) {
    IALOG.warn("terminateEventByIncident - No event found for termination.");
  } else {
    IALOG.warn("terminateEventByIncident - Multiple matches found, unable to identify a record for termination.");
  }
}

// Decrypts the password in the password file
// Password file is generated with the IA iapassword.bat/.sh file
function getPassword(passwordFile) {
  try {
    var encryptionUtils = new EncryptionUtils();
    var file = new File(passwordFile);
    return encryptionUtils.decrypt(file);
  } catch (e) {
    return "";
  }
}
