// -----------------------------------------------------------------------------
// xMatters Integration for BMC ProactiveNet Performance Management
// Encapsulates the operations available in the BMC Impact Integration
// Web services, which provide an
// interface to query and update events and data in a BPPM cell.
//
// While the BMC product name for these Web Services is IIWS, the wsdl and
// SOAP endpoint use the acronym IMWS and in this integration the 2 terms
// are used interchangeably.
//
// IIWS operations and parameters are described in the
// BMC Impact Integration Web Services Developer Guide.
// High-level functions for updating BPPM Events via the IIWS Web services.
// -----------------------------------------------------------------------------

// Namespace objects needed to make queries of XML documents returned by IMWS
var SOAP_ENV_NS = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");
var IMAP_NS = new Namespace("http://blueprint.bmc.com/ImapiElems");
var BAS_NS = new Namespace("bas", "http://blueprint.bmc.com/BasicTypes");
var EVEN_NS = new Namespace("http://blueprint.bmc.com/Event");

var IMWS = WSUtil.extend({

    LOG_SOURCE: "bmcimws.js: ",

    /**
     * BPPM / IMWS Web service constants.
     */

    // Allowed values for the event status slot (incomplete)
    IMWS_STATUS_OPEN: "OPEN",
    IMWS_STATUS_ACKNOWLEDGE: "ACK",
    IMWS_STATUS_CLOSED: "CLOSED",

    IMWS_STATUS_NONE: null,

    // Expected values for the messageClass element
    IMWS_MESSAGE_CLASS_EVENT: "EVENT",

    // Expected values for the messageType element
    IMWS_MESSAGE_TYPE_NEW_EVENT: "MSG_TYPE_NEW_EVENT",
    IMWS_MESSAGE_TYPE_MOD_EVENT: "MSG_TYPE_MOD_EVENT",

    IMWS_SOAP_VERSION: "1_1",
    IMWS_WSDL_DEFN: "integrationservices/bmcbppm30/soap/BMC-IMWS-2010-01-soapui-project.xml",

    /**
     * Constructor
     * @param endPoint - SOAP EndPoint URL for IMWS
     * @param userName - username to connect as
     * @param password - session id for the webservices session
     */
    init: function()
    {
        this._super();
        this.endPoint = IIWS_URL;

        this.log.debug("IIWS constructed. endPoint [" + this.endPoint + "]");
    },
  
    /******************************************************************************/
    /*       Start of methods to invoke operations in ImpactManager Web services  */
    /******************************************************************************/

    /******************************************************************************/
    /*                           Public Methods                                   */
    /******************************************************************************/

    /**
     * Creates a connection to the BPPM instance via a IMWS Web Services instance.
     *
     * A connection is needed to send events to a BPPM instance, but not to query events.
     * Connections can be disposed using Disconnect. They have no configurable expiration period.
     *
     * @param instanceName - the name of the BPPM instance to which you want to connect
     * @param bufferType - a string identifying one of the standard buffer types.
     * @return - the XML response from the Connect SOAP operation.
     */
    connect: function(instanceName, userName, password, bufferType)
    {
        this.log.debug("Enter - connect. instanceName [" + instanceName + "], bufferType [" + bufferType + "]");

        // Get the parameterized SOAP message for this request from the soapUI project file
        var msg = new SOAPMessage(this.IMWS_WSDL_DEFN, "Connect", "Connect", this.IMWS_SOAP_VERSION);

        // Set the actual parameter values in the request
        msg.setParameter("imname", instanceName);
        msg.setParameter("userName", userName);
        msg.setParameter("password", password);
        msg.setParameter("bufferType", bufferType);

        var soapResponse = this.sendReceive(this.endPoint, msg);

        this.log.debug("soapResponse: " + soapResponse);
        this.log.debug("Exit - connect");

        if (soapResponse == null)
        {
            throw new IllegalStateException("Could not create connection to IMWS for instanceName [" + instanceName + "], bufferType [" + bufferType + "]");
        }

        return soapResponse;
    },

    // -------------------------------------------------------------------------
    // sendEvent
    //
    // Invoke the SendEvent operation, sending a message that can modify an
    // existing event or create a new event using the supplied eventSlots XML object.
    //
    // -------------------------------------------------------------------------
    sendEvent: function(connectionId, messageClass, messageType, eventSlots)
    {
        this.log.debug("Enter - sendEvent connectionId [" + connectionId + "], messageClass [" + messageClass + "], messageType [" + messageType + "]");
        this.log.debug("eventSlots [" + eventSlots + "]");

        // Get the parameterized SOAP message for this request from the soapUI project file
        var msg = new SOAPMessage(this.IMWS_WSDL_DEFN, "SendEvent", "sendEvent", this.IMWS_SOAP_VERSION);

//        this.log.debug("SOAPMessage [" + msg.getRequest() + "]");

        // Set the actual parameter values in the request
        msg.setParameter("connection", connectionId);
        msg.setParameter("timeout", IIWS_SEND_EVENT_TIMEOUT);

        // Set the class of message and type of message being sent. These
        // will depend on whether it is an event update or a request to
        // perform a diagnostic action.
        msg.setParameter("messageClass", messageClass);
        msg.setParameter("messageType", messageType);

        // This parameter contains the name/value pairs that define the event slots
        msg.setParameter("eventSlots", eventSlots, false);

        var soapResponse = this.sendReceive(this.endPoint, msg);

        this.log.debug("soapResponse: " + soapResponse);
        this.log.debug("Exit - sendModifyEvent");

        return soapResponse;
    },

    /* -------------------------------------------------------------------------
     * getHexEpochTime
     *
     * @return - the current epoch time in seconds, as a hexadecimal value
     *
     * -------------------------------------------------------------------------
     */
    getHexEpochTime: function()
    {
        var epochTime = Math.floor(((new Date).getTime()) / 1000);

        return "0x" + epochTime.toString(16);
    },
    
    /* -------------------------------------------------------------------------
     * queryEventById
     *
     * Searches for the specified event.
     *
     * @param instanceName - the name of the BPPM instance to which you want to connect
     * @param eventId - the value of the mc_ueid slot of the event you want to find.
     * @return - the XML response from the Connect SOAP operation.
     *
     * The response contains a resultHandle and resultCount. The resultHandle
     * can be passed to RetrieveQueryResults to get the actual event description.
     *
     * -------------------------------------------------------------------------
     */
    queryEventById: function(instanceName, eventId)
    {
        this.log.debug("Enter - queryEventById instanceName [" + instanceName + "], eventId [" + eventId + "]");

        // Get the parameterized SOAP message for this request from the soapUI project file
        var msg = new SOAPMessage(this.IMWS_WSDL_DEFN, "QueryEventByID", "queryEventByID", this.IMWS_SOAP_VERSION);

        // Set the actual parameter values in the request
        msg.setParameter("imname", instanceName);
        msg.setParameter("eventId", eventId);

        var soapResponse = this.sendReceive(this.endPoint, msg);

        this.log.debug("soapResponse: " + soapResponse);
        this.log.debug("Exit - queryEventById");

        return soapResponse;
    },

    /* -------------------------------------------------------------------------
     * retrieveQueryResults
     *
     * Given the result handle from a query operation, retrieves XML descriptions
     * of the events that matched the query.
     *
     * @param resultHandle - the resultHandle returned by the Query... operation
     * @param startIndex - a 1-based index into the full list of query results.
     * @numberOfEvents - the maximum number of events to be returned.
     *
     * The response contains a list of event descriptions.
     *
     * -------------------------------------------------------------------------
     */
    retrieveQueryResults: function(resultHandle, startIndex, numberOfEvents)
    {
        this.log.debug("Enter - retrieveQueryResults resultHandle [" + resultHandle + "], startIndex [" + startIndex + "], numberOfEvents [" + numberOfEvents + "]");

        // Get the parameterized SOAP message for this request from the soapUI project file
        var msg = new SOAPMessage(this.IMWS_WSDL_DEFN, "RetrieveQueryResults", "retrieveQueryResults", this.IMWS_SOAP_VERSION);

        // Set the actual parameter values in the request
        msg.setParameter("resultHandle", resultHandle);
        msg.setParameter("startIndex", startIndex);
        msg.setParameter("numberOfEvents", numberOfEvents);
        msg.setParameter("timeout", IIWS_RETRIEVE_QUERY_RESULTS_TIMEOUT);

        var soapResponse = this.sendReceive(this.endPoint, msg);

        //this.log.debug("soapResponse: " + soapResponse);
        this.log.debug("Exit - retrieveQueryResults");

        return soapResponse;
    },

    /* -------------------------------------------------------------------------
     * endQuery
     *
     *  Notify the BPPM cell that the query is finished so it can release the
     *  resultHandle.
     * @param resultHandle. - the resultHandle to be released.
     *
     * The response is expected to include the string "NoValue_output"
     *
     * -------------------------------------------------------------------------
     */
    endQuery: function(resultHandle)
    {
        this.log.debug("Entering - endQuery with resultHandle [" + resultHandle + "]");

        var msg = new SOAPMessage(this.IMWS_WSDL_DEFN, "EndQuery", "endQuery", this.IMWS_SOAP_VERSION);

        msg.setParameter("resultHandle", resultHandle);

        var soapResponse = this.sendReceive(this.endPoint, msg);

        this.log.debug("\tsoapResponse is: " + soapResponse);
        this.log.debug("Exiting - endQuery()");

        return soapResponse;
    },

    /******************************************************************************/
    /*                           Private Methods                                  */
    /******************************************************************************/

    /**
     * Checks if the given value is null or empty string
     * @param value parameter to check
     * @return true if the value is empty, false otherwise
     */
    isEmpty: function(value)
    {
        if (value == null || "".equalsIgnoreCase(value) || value == "")
        {
            return true;
        }
        return false;
    },
  
    /**
     * At implementation time it was found that Mozilla's implementation of E4X
     * does not support XML declarations (<? ... ?>), therefore if they exist in
     * the payload returned from CA SDM, it needs to be stripped out.
     * http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4
     *
     * This method takes a parameter:
     * 1. Ensures it is a string
     * 2. Removes any XML declarations
     * 3. returns a string which can be used to create E4X objects such as
     *    XML or XMLList.
     */
    formatStringForE4X: function(string)
    {
        this.log.debug("XML string that needs XML declarations removed: " + string);
        string = string.toString();
        string = string.replace(/<\?(.*?)\?>/g,'');
        this.log.debug("XML declarations should be removed: " + string);
        return string;
    },
});
