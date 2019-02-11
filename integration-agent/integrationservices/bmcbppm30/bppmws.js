// -----------------------------------------------------------------------------
// xMatters Integration for BMC ProactiveNet Performance Management
//
// High-level functions for updating BPPM Events via the IIWS Web services.
// -----------------------------------------------------------------------------

/**
 * Connection to the IMWS Web service. This will be initialized as needed and
 * is persisted between invocations of the script.
 */
var connectionId = null;

/**
 * Provides convenience functions needed to carry out the high-level actions
 * the IA needs to perform on BPPM events.
 * 
 * The methods in this class are implemented mainly via the operations
 * in the IMWS Web service.
 *
 *
 */
var BPPMWS = IMWS.extend({

    LOG_SOURCE: "bppmws.js: ",

    init: function()
    {
        this._super();
    },

    // -------------------------------------------------------------------------
    // updateEvent
    //
    // Update the BPPM event identified by event ID according to the parameters
    // provided.
    //
    // eventId - the BPPM ID of the event to be updated
    // newStatus - the new status of the event, or null if it is not to be changed.
    // assignee - the new assignee of the event, or null if it is not to be changed
    // responder - identifies the person | device that has responded to the event
    // logMessage - any message to be used as part of a logs entry, or null
    // notesMessage - any message to be used as part of a notes entry, or null
    // -------------------------------------------------------------------------
    updateEvent: function(eventId, newStatus, assignee, responder, logMessage, notesMessage, isRepliedFromXM)
    {
        this.log.debug( "Enter - updateEvent: eventId [" + eventId + "]");
        this.log.debug( "newStatus [" + newStatus + "], assignee [" + assignee + "], responder [" + responder + "]");
        this.log.debug( "logMessage [" + logMessage + "]");
        this.log.debug( "notesMessage [" + notesMessage + "]");

        // Need the existing BPPM event to process the request
        var existingEvent = this.getExistingEvent(eventId);

        default xml namespace = BAS_NS;

        var existingStatus = existingEvent.NameValue_element.(name == "status").value.string_value;

        this.log.debug( "existingStatus [" + existingStatus + "]");

        var isClosed = (String(existingStatus).toLowerCase()) == "closed";

        // The mc_ueid slot identifies the event in BPPM
        var eventSlots = <NameValue_element>
                                <name>mc_ueid</name>
                                    <value>
                                        <string_value>{eventId}</string_value>
                                    </value>
                                <value_type>STRING</value_type>
                            </NameValue_element>;

        // Add the status, logs and event slots if the caller has provided them.

        if (newStatus != null)
        {
            // ---------------------------------------------------------------------
            // Don't change the status of events that are already closed, but allow
            // updates to logs e.g. to record that someone ignored the event.
            // ---------------------------------------------------------------------
            if (!isClosed)
            {
                eventSlots += this.makeStatusSlot(newStatus);
            }
            else
            {
                this.log.warn( "Cannot update the status of an event that is already closed");
            }
        }

        if (assignee != null)
        {
            eventSlots += this.makeOwnerSlot(assignee);
        }

        if (logMessage != null)
        {
            eventSlots += this.makeEventLogsSlot(existingEvent, responder, logMessage);
        }

        if (notesMessage != null)
        {
            eventSlots += this.makeEventNotesSlot(existingEvent, responder, notesMessage);
        }

        // Update the xMatters-custom slot to indicate there has been a response of some kind
        if (isRepliedFromXM)
        {
            eventSlots += <NameValue_element>
                            <name>is_replied_from_XM</name>
                            <value>
                               <string_value>YES</string_value>
                            </value>
                            <value_type>STRING</value_type>
                          </NameValue_element>
        }

        default xml namespace = EVEN_NS;

        eventSlots += <subject>{IIWS_SEND_EVENT_SUBJECT}</subject>;

        // this.log.debug( "eventSlots [" + eventSlots + "]");

        this.connectAndSendEvent(this.IMWS_MESSAGE_CLASS_EVENT, this.IMWS_MESSAGE_TYPE_MOD_EVENT, eventSlots);

        this.log.debug( "Exit - updateEvent");
    },

    // -------------------------------------------------------------------------
    // connectAndSendEvent
    // 
    // Take the BPPM event slots XML document and sends an Event to IMWS, having
    // first made sure that there is an open connection for the SendEvent operation
    // to use.
    //
    // The connections that the SendEvent operation requires can be re-used
    // indefinitely, but make become invalid if e.g BPPM is restarted. So, if
    // the SendEvent fails we make one attempt to get a new connection and
    // retry the SendEvent.
    // -------------------------------------------------------------------------
    connectAndSendEvent: function(messageClass, messageType, eventSlots)
    {
        this.log.debug( "Enter - connectAndSendEvent");

        // If the connection has become invalid, retrying once should create a new one.
        var gotResponse = false;
        var haveRetried = false

        // Implements a single retry of sendModifyEvent() in case the current connection is invalid
        while (!gotResponse && !haveRetried)
        {
            // Won't have a connection the first time this script is executed after the IA is started.
            if (connectionId == null)
            {
                var connectResponse = this.connect(BPPM_CELL, IIWS_USERNAME, IIWS_PASSWORD, IIWS_BUFFER_TYPE);
                connectionId = connectResponse.IMAP_NS::Connect_output.IMAP_NS::connectionId;
                this.log.debug("connectAndSendEvent - got new connection");
            }
            else
            {
                this.log.debug("connectAndSendEvent - using existing connection");
            }

            try
            {
                this.log.debug("connectAndSendEvent - connectionId [" + connectionId +"], haveRetried [" + haveRetried +"]");

                this.sendEvent(connectionId, messageClass, messageType, eventSlots);
                gotResponse = true;
            }
            catch (e)
            {
                this.log.warn("Failed to send Event to IMWS. Exception: " + e);

                if (haveRetried)
                {
                    // If sendModifyEvent() failed and we've already retried, re-throw the exception
                    throw e;
                }
                else
                {
                    // Reset connection ID and retry in order to get a fresh connection to IMWS
                    connectionId = null;
                    haveRetried = true;
                }
            }
        }

        this.log.debug( "Exit - connectAndSendEvent");
    },

    // -------------------------------------------------------------------------
    // getExistingEvent
    //
    // Get the XML that describes the event have the ID provided.
    // -------------------------------------------------------------------------
    getExistingEvent: function(eventId)
    {
        this.log.debug( "Enter - getExistingEvent: eventId [" + eventId + "]");

        var querySoapResponse = this.queryEventById(BPPM_CELL, eventId);

        var resultCount = querySoapResponse.IMAP_NS::QueryResultHandle_output.IMAP_NS::resultCount;
        var resultHandle = querySoapResponse.IMAP_NS::QueryResultHandle_output.IMAP_NS::resultHandle;

        this.log.debug("setEventStatus: resultCount [" + resultCount + "], resultHandle [" + resultHandle + "]");

        if (parseInt(resultCount) != 1)
        {
            // Query by ID should return exactly one result
            throw new IllegalStateException("setEventStatus: QueryById for ID [" + eventId + "] returns count of [" + resultCount + "]")
        }

        // Get the SOAP response for query
        var queryResults = this.retrieveQueryResults(resultHandle, 1, 1);
        
        // Locate the <NameValueArray_element> tag that is the event desscription
        var existingEvent = queryResults.IMAP_NS::RetrieveQueryResults_output.IMAP_NS::results.BAS_NS::NameValueArray_element;

        // Close the connection to the cell and free the query handle (sup-7419)
        var endQueryResult = this.endQuery(resultHandle);

        this.log.debug( "Exit - getExistingEvent");

        return existingEvent;
    },

    // -------------------------------------------------------------------------
    // makeStatusSlot
    //
    // Creates and returns the XML definition of an event slot that will set
    // the event status appropriately.
    // -------------------------------------------------------------------------
    makeStatusSlot: function(newStatus)
    {
        default xml namespace = BAS_NS;

        return   <NameValue_element>
                   <name>status</name>
                   <value>
                      <string_value>{newStatus}</string_value>
                   </value>
                   <value_type>STRING</value_type>
                </NameValue_element>;
},

    // -------------------------------------------------------------------------
    // makeOwnerSlot
    //
    // Creates and returns the XML definition of an event slot that will set
    // the event status appropriately.
    // -------------------------------------------------------------------------
    makeOwnerSlot: function(assignee)
    {
        default xml namespace = BAS_NS;

        return   <NameValue_element>
                   <name>mc_owner</name>
                   <value>
                      <string_value>{assignee}</string_value>
                   </value>
                   <value_type>STRING</value_type>
                </NameValue_element>;
},

    // -------------------------------------------------------------------------
    // makeEventLogsSlot
    //
    // Creates the XML element for the event logs / mc_operations slot,
    // based on the values in that slot from the existing event and the details
    // of the new update.
    //
    // It is assumed that the event already has an mc_operations slot, because
    // the act of sending a notification to xMatters will have created one.
    //
    // This slot contains a <bas:StringArray> element which itself contains the
    // actual operations log entries as groups of 5 <bas:string_element> elements.
    // -------------------------------------------------------------------------
    makeEventLogsSlot: function (existingEvent, responder, actionMessage)
    {
        this.log.debug( "Enter - makeEventLogsSlot");

        default xml namespace = BAS_NS;

        // Locate the <NameValue_element> that contains the existing logs for the event
        var mcOperations = existingEvent.NameValue_element.(name == "mc_operations");

        if (mcOperations == null)
        {
            throw new IllegalStateException("BPPM event does not have an existing logs slot.")
        }
        // this.log.debug("mcOperations: " + mcOperations);

        // Create the 5 <string_element> elements, substituting the appropriate values
        var opsEntry1 = <string_element>{this.getHexEpochTime()}</string_element>;
        var opsEntry2 = <string_element>{responder}</string_element>;
        var opsEntry3 = <string_element/>;
        var opsEntry4 = <string_element/>;
        var opsEntry5 = <string_element>{actionMessage}</string_element>;

        // Locate the <bas:StringArray> element that contains the operations log entries.
        var stringArrayElement = mcOperations.BAS_NS::value.BAS_NS::StringArray;

        stringArrayElement.appendChild(opsEntry1);
        stringArrayElement.appendChild(opsEntry2);
        stringArrayElement.appendChild(opsEntry3);
        stringArrayElement.appendChild(opsEntry4);
        stringArrayElement.appendChild(opsEntry5);

        this.log.debug("mcOperations: " + mcOperations);
        this.log.debug( "Exit - makeEventLogsSlot");

        return mcOperations;
    },

    // -------------------------------------------------------------------------
    // makeEventNotesSlot
    //
    // User annotations go in the BPPM event notes or the mc_notes slot.
    //
    // Creates the XML element for the mc_notes slot that holds user annotations,
    // based on the values in that slot from the existing event and the details
    // of the new update.
    //
    // All notes information is in children of the <bas:StringArray> element,
    // in groups of 3: time stamp, user, note text.
    //
    // It is assumed that the events can have no annotations initially, but that
    // in that case they still have an mc_notes slot definition, containing
    // an empty <bas:StringArray/> element that we can append to. (This is
    // what IMWS actually returns for events with no notes.)
    // -------------------------------------------------------------------------
    makeEventNotesSlot: function (existingEvent, responder, annotation)
    {
        this.log.debug( "Enter - makeEventNotesSlot");

        // Need this default namespace for filtering and adding elements
        default xml namespace = BAS_NS;

        // Locate the <NameValue_element> that contains the existing notes for the event
        var mcNotes = existingEvent.NameValue_element.(name == "mc_notes");

        if (mcNotes == null)
        {
            throw new IllegalStateException("BPPM event does not have an existing notes slot.")
        }

        // Create the <string_element> elements, substituting the appropriate values
        var opsEntry1 = <string_element>{this.getHexEpochTime()}</string_element>;
        var opsEntry2 = <string_element>{responder}</string_element>;
        var opsEntry3 = <string_element>{annotation}</string_element>;

        // The <StringArray> element contains the actual notes entries.
        // These exist as groups of 3 <bas:string_element> elements.
        var stringArrayElement = mcNotes.BAS_NS::value.BAS_NS::StringArray;

        stringArrayElement.appendChild(opsEntry1);
        stringArrayElement.appendChild(opsEntry2);
        stringArrayElement.appendChild(opsEntry3);

        this.log.debug("mcNotes: " + mcNotes);
        this.log.debug( "Exit - makeEventNotesSlot");

        return mcNotes;
    },
});