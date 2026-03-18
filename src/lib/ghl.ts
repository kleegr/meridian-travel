import axios from "axios";
import FormData from "form-data";
/* eslint-disable */

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface GHLAuth {
    access_token: string;
    locationId: string;
    userId?: string;
}

export interface ContactData {
    phone?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    contactId?: string;
    message?: string;
    conversationId?: string;
    attachments?: string[];
    tags?: string[];
    customFields?: CustomFieldsData[];
    status?: string;
    userId?: string;
    messageType?: string;
    subject?: string;
    html?: string;
    emailFrom?: string;
    emailTo?: string;
    emailCc?: string[];
    emailBcc?: string[];
    replyMessageId?: string;
    templateId?: string;
    scheduledTimestamp?: number;
    emailReplyMode?: string;
    threadId?: string;
}

export interface SubaccountData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    [key: string]: any;
}

export interface UserData {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: any;
}

export interface CustomFieldsData {
    id: any;
    name?: string;
    fieldKey?: string;
    field_value: string;
}

export interface updateContactData {
    contactId: string;
    customFields?: CustomFieldsData[];
    additionalEmails?: Array<{ email: string }>;
    additionalPhones?: Array<{ phone: string; phoneLabel?: string | null }>;
    address1?: string;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: any;
}

export interface ApiResponse<T> {
    success: boolean;
    status: number;
    data: T | string | null;
}
/* -------------------------------------------------------------------------- */
/*                         SEARCH CONTACTs                          */
/* -------------------------------------------------------------------------- */

export const searchContacts = async (
    ghl: GHLAuth,
    query?: string,
    searchAfter?: string[]
): Promise<ApiResponse<any>> => {
    const searchData: any = {
        locationId: ghl.locationId,
        pageLimit: 20
    };

    if (searchAfter) {
        searchData.searchAfter = searchAfter;
    }

    if (query) {
        searchData.query = query;
    }

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/contacts/search",
            searchData,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data?.contacts || [],
        };
    } catch (error: any) {
        console.error("searchContactByPhone error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};
/* -------------------------------------------------------------------------- */
/*                         SEARCH CONTACT BY PHONE                            */
/* -------------------------------------------------------------------------- */

export const searchContactByPhone = async (
    ghl: GHLAuth,
    data: ContactData
): Promise<ApiResponse<any>> => {
    const searchData = {
        locationId: ghl.locationId,
        pageLimit: 100,
        filters: [
            {
                group: "AND",
                filters: [
                    {
                        field: "phone",
                        operator: "eq",
                        value: data.phone,
                    },
                ],
            },
        ],
    };

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/contacts/search",
            searchData,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data?.contacts?.[0] || null,
        };
    } catch (error: any) {
        console.error("searchContactByPhone error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                              UPSERT CONTACT                                */
/* -------------------------------------------------------------------------- */

export const upsertContact = async (
    ghl: GHLAuth,
    data: ContactData,
    // userId?: string
): Promise<ApiResponse<any>> => {
    const contactData = {
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        email: data.email,
        locationId: ghl.locationId,
        phone: data.phone,
        // assignedTo: userId,
        tags: data.tags,
        customFields: data.customFields
    };

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/contacts/upsert",
            contactData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data?.contact || null,
        };
    } catch (error: any) {
        console.error("upsertContact error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                              UPDATE CONTACT                                */
/* -------------------------------------------------------------------------- */

export const updateContact = async (
    ghl: GHLAuth,
    data: updateContactData
): Promise<ApiResponse<any>> => {
    const { contactId, ...updateFields } = data;
    // Remove undefined values
    const body = Object.fromEntries(Object.entries(updateFields).filter(([, v]) => v !== undefined));
    try {
        const result = await axios.put(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        // console.log("updateContact result:", result.data);

        return {
            success: true,
            status: 200,
            data: result.data?.contact || null,
        };
    } catch (error: any) {
        console.error("updateContact error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};


/* -------------------------------------------------------------------------- */
/*                         ADD INBOUND MESSAGE                                */
/* -------------------------------------------------------------------------- */

export const addInboundMessage = async (
    ghl: GHLAuth,
    data: ContactData
): Promise<ApiResponse<any>> => {
    const messageData = {
        type: "Custom",
        contactId: data.contactId,
        attachments: data.attachments,
        conversationProviderId: process.env.NEXT_PUBLIC_CONVERSATION_PROVIDER_ID!, // static for now

    };

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/conversations/messages/inbound",
            messageData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("addInboundMessage error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                         ADD MESSAGE TO CONVERSATION                        */
/* -------------------------------------------------------------------------- */

export const addMessageToConversation = async (
    ghl: GHLAuth,
    data: ContactData
): Promise<ApiResponse<any>> => {
    const messageData = {
        type: "Custom",
        contactId: data.contactId,
        message: data.message,
        ...(data.attachments && { attachments: data.attachments }),
        conversationId: data.conversationId,
        conversationProviderId: process.env.NEXT_PUBLIC_CONVERSATION_PROVIDER_ID!, // static for now
        ...(data.replyMessageId && { replyMessageId: data.replyMessageId }),
        ...(data.threadId && { threadId: data.threadId }),
    };

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/conversations/messages/inbound",
            messageData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("addMessageToConversation error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                           SENT OUTBOUND MESSAGE                            */
/* -------------------------------------------------------------------------- */

export const sentOutboundMessage = async (
    ghl: GHLAuth,
    data: ContactData
): Promise<ApiResponse<any>> => {
    const messageData = {
        type: data.messageType || "Custom",
        contactId: data.contactId,
        ...(data.message && { message: data.message }),
        ...(data.attachments && { attachments: data.attachments }),
        conversationProviderId: process.env.NEXT_PUBLIC_CONVERSATION_PROVIDER_ID!, // static for now
        direction: "outbound",
        ...(data.status && { status: data.status }),
        ...(data.userId && { userId: data.userId }),
        ...(data.conversationId && { conversationId: data.conversationId }),
        ...(data.subject && { subject: data.subject }),
        ...(data.html && { html: data.html }),
        ...(data.emailFrom && { emailFrom: data.emailFrom }),
        ...(data.emailTo && { emailTo: data.emailTo }),
        ...(data.emailCc && { emailCc: data.emailCc }),
        ...(data.emailBcc && { emailBcc: data.emailBcc }),
        ...(data.replyMessageId && { replyMessageId: data.replyMessageId }),
        ...(data.templateId && { templateId: data.templateId }),
        ...(data.scheduledTimestamp && { scheduledTimestamp: data.scheduledTimestamp }),
        ...(data.emailReplyMode && { emailReplyMode: data.emailReplyMode }),
        ...(data.threadId && { threadId: data.threadId })
    };


    console.log("email_outbounf_message_data", messageData);

    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/conversations/messages",
            messageData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-04-15",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("sentOutboundMessage error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                  TICKET CUSTOM OBJECT RECORDS & ASSOCIATIONS               */
/* -------------------------------------------------------------------------- */

export interface TicketRecordProps {
    [key: string]: any;
}

export const createTicketRecord = async (
    ghl: GHLAuth,
    properties: TicketRecordProps
): Promise<ApiResponse<any>> => {
    const body = {
        locationId: ghl.locationId,
        properties,
    };
    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/objects/custom_objects.tickets/records",
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("createTicketRecord error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

export const updateTicketRecord = async (
    ghl: GHLAuth,
    recordId: string,
    properties: TicketRecordProps
): Promise<ApiResponse<any>> => {
    try {
        const result = await axios.put(
            `https://services.leadconnectorhq.com/objects/custom_objects.tickets/records/${recordId}?locationId=${encodeURIComponent(ghl.locationId)}`,
            properties,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("updateTicketRecord error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

export const searchTicketRecords = async (
    ghl: GHLAuth,
    body: any
): Promise<ApiResponse<any>> => {
    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/objects/custom_objects.tickets/records/search",
            {
                locationId: ghl.locationId,
                ...body,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("searchTicketRecords error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/**
 * Get the association definition for contact ↔ custom_objects.tickets in this location.
 * GET /associations/objectKey/custom_objects.tickets returns a single object, e.g.:
 * { locationId, id, key, firstObjectKey, secondObjectKey, firstObjectLabel, secondObjectLabel, associationType }
 * Used to create relations via associations/relations/bulk (firstRecordId=contact, secondRecordId=ticket record).
 */
export const getTicketAssociation = async (
    ghl: GHLAuth
): Promise<ApiResponse<any>> => {
    try {
        const result = await axios.get(
            "https://services.leadconnectorhq.com/associations/objectKey/custom_objects.tickets",
            {
                params: { locationId: ghl.locationId },
                headers: {
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        // API returns a single association object (not a list)
        const data = result.data ?? null;
        return {
            success: true,
            status: 200,
            data,
        };
    } catch (error: any) {
        console.error("getTicketAssociation error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

export const createTicketRelation = async (
    ghl: GHLAuth,
    associationId: string,
    contactId: string,
    ticketRecordId: string
): Promise<ApiResponse<any>> => {
    const body = {
        locationId: ghl.locationId,
        add: [
            {
                associationId,
                firstRecordId: contactId,
                secondRecordId: ticketRecordId,
            },
        ],
    };
    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/associations/relations/bulk",
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("createTicketRelation error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                     SEND INTERNAL COMMENT (HighLevel)                     */
/* -------------------------------------------------------------------------- */

export interface InternalCommentPayload {
    contactId: string;
    message: string;
    userId: string;
    mentions?: string[];
}

export const sendInternalComment = async (
    ghl: GHLAuth,
    data: InternalCommentPayload
): Promise<ApiResponse<any>> => {
    const payload = {
        type: "InternalComment",
        contactId: data.contactId,
        message: data.message,
        userId: data.userId,
        ...(data.mentions && data.mentions.length > 0 && { mentions: data.mentions }),
    };
    try {
        const result = await axios.post(
            "https://services.leadconnectorhq.com/conversations/messages",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-04-15",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );
        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("sendInternalComment error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                           UPDATE MESSAGE STATUS                            */
/* -------------------------------------------------------------------------- */

export const updateMessageStatus = async (
    ghl: GHLAuth,
    messageId: string
): Promise<ApiResponse<any>> => {
    try {
        const result = await axios.put(
            `https://services.leadconnectorhq.com/conversations/messages/${messageId}/status`,
            { status: "read" },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: result.data || null,
        };
    } catch (error: any) {
        console.error("updateMessageStatus error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};
export const searchConversation = async (
    ghl: GHLAuth,
    contactId: string,
    limit = 100, // Default limit per page
) => {
    let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://services.leadconnectorhq.com/conversations/search`,
        params: {
            locationId: ghl?.locationId,
            limit: limit,
            contactId: contactId || "",
        },
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + ghl?.access_token,
            Version: "2021-04-15", // Version confirmed as header from docs
        },
    };



    try {
        const response = await axios.request(config);
        // Based on your screenshot, 'conversations' is an array directly in response.data, and 'total' is also directly in response.data
        return {
            success: true,
            status: 200,
            data: response?.data?.conversations || [],
            total: response?.data?.total || 0,
            // We might need to return a 'nextCursor' if the API provides an explicit one,
            // but 'startAfterDate' logic implies we extract it from the last item.
        };
    } catch (error: any) {
        console.error("Error in searchConversation:", error.response ? error.response.data : error.message);
        return {
            success: false,
            status: error.response ? error.response.status : 500,
            data: error.response ? error.response.data : error.message,
            total: 0
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                            GET CONVERSATION                                */
/* -------------------------------------------------------------------------- */

export const getConversation = async (
    ghl: GHLAuth,
    conversationId: string
): Promise<ApiResponse<any>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/conversations/${conversationId}`,
            {
                headers: {
                    Accept: "application/json",
                    Version: "2021-04-15",
                    Authorization: `Bearer ${ghl.access_token}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data || null,
        };
    } catch (error: any) {
        console.error("getConversation error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};
/* -------------------------------------------------------------------------- */
/*                            CREATE CONVERSATION                             */
/* -------------------------------------------------------------------------- */

export const createConversation = async (
    ghl: GHLAuth,
    contactId: string
): Promise<ApiResponse<any>> => {
    const payload = {
        locationId: ghl.locationId,
        contactId,
        assignedTo: ghl.userId
    };

    try {
        const response = await axios.post(
            "https://services.leadconnectorhq.com/conversations/",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data?.conversation || null,
        };
    } catch (error: any) {
        console.error("createConversation error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

export async function getAccountIdField(ghl: GHLAuth, contactId: string) {
    try {
        // 1. Fetch contact details
        const contactRes = await axios.get(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                },
            }
        );

        const contact = contactRes.data?.contact;
        const contactFields = contact?.customFields || [];

        if (!contactFields.length) return null;

        // 2. Fetch all custom fields for this location
        const locationFields = await getCustomFields(
            ghl.locationId,
            ghl.access_token
        );

        // 3. Find which field corresponds to "Account ID"
        const accountField = locationFields.find(
            (f: any) => f.name === "Group ID"
        );

        if (!accountField) return null;

        // 4. Find that field’s value from contact’s fields
        const matchedField = contactFields.find(
            (cf: any) => cf.id === accountField.id
        );

        return matchedField?.value || null;
    } catch (err: any) {
        console.error("Error fetching Account ID field:", err.message);
        return null;
    }


}

export const getCustomFieldValue = async (ghl: GHLAuth, contactId: string, fieldName: string) => {

    try {
        // 1. Fetch contact details
        const contactRes = await axios.get(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                },
            }
        );

        const contact = contactRes.data?.contact;
        const contactFields = contact?.customFields || [];

        if (!contactFields.length) return null;

        // 2. Fetch all custom fields for this location
        const locationFields = await getCustomFields(
            ghl.locationId,
            ghl.access_token
        );
        // 3. Find which field corresponds to "fieldName"
        // Prefer "Kleegr Travels" folder values to avoid duplicates across folders.
        const isFolder = (f: any) =>
            f?.dataType === "FOLDER" ||
            f?.dataType === "folder" ||
            f?.type === "FOLDER" ||
            f?.data_type === "FOLDER";

        const folder = (locationFields || []).find((f: any) => f?.name === CUSTOM_FOLDER_NAME && isFolder(f));
        const folderId = folder?.id;

        const scopedFields = folderId ? (locationFields || []).filter((f: any) => f?.parentId === folderId) : locationFields;
        const targetField = scopedFields.find((f: any) => f?.name === fieldName);

        if (!targetField) return null;

        // 4. Find that field’s value from contact’s fields
        const matchedField = contactFields.find(
            (cf: any) => cf.id === targetField.id
        );

        return matchedField?.value || null;
    } catch (err: any) {
        console.error(`Error fetching ${fieldName} field:`, err.message);
        return null;
    }
}

export const getContactById = async (ghl: GHLAuth, contactId: string): Promise<ApiResponse<any>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data?.contact || null,
        };
    } catch (error: any) {
        console.error("getContactById error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};



/* -------------------------------------------------------------------------- */
/*                        UPLOAD FILE TO MEDIA LIBRARY                        */
/* -------------------------------------------------------------------------- */




/* -------------------------------------------------------------------------- */
/*                            GET SUBACCOUNT (LOCATION)                       */
/* -------------------------------------------------------------------------- */

export interface SubaccountData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

export interface UserData {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: {
        type: string;
        role: string;
    }
}

export const getSubaccount = async (
    accessToken: string,
    locationId: string
): Promise<ApiResponse<SubaccountData>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/locations/${locationId}`,
            {
                headers: {
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data?.location || null,
        };
    } catch (error: any) {
        console.error("getSubaccount error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};
/* -------------------------------------------------------------------------- */
/*                            GET SUBACCOUNT USER                           */
/* -------------------------------------------------------------------------- */

export const getSubaccountUser = async (
    accessToken: string,
    userId: string
): Promise<ApiResponse<UserData>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/users/${userId}`,
            {
                headers: {
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data || null,
        };
    } catch (error: any) {
        console.error("getSubaccountUser error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                            GET SUBACCOUNT USERS                            */
/* -------------------------------------------------------------------------- */

export const getSubaccountUsers = async (
    accessToken: string,
    locationId: string
): Promise<ApiResponse<UserData[]>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/users/?locationId=${locationId}`,
            {
                headers: {
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data?.users || [],
        };
    } catch (error: any) {
        console.error("getSubaccountUsers error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                                  UPLOAD FILE                               */
/* -------------------------------------------------------------------------- */
export const uploadFileToMediaLibrary = async (
    ghl: GHLAuth,
    fileUrl: string,
    data: Buffer,
    filename: string,
    contentType: string,
): Promise<ApiResponse<any>> => {

    try {
        const form = new FormData();
        if (data) {

            // 2. Prepare form-data for upload
            form.append("file", data, { filename: filename, contentType: contentType });
        } else {
            form.append("hosted", true);
            form.append("fileUrl", fileUrl);
        }

        // 3. Upload to GHL
        const response = await axios.post(
            "https://services.leadconnectorhq.com/medias/upload-file",
            form,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    ...form.getHeaders(),
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data
        };

    } catch (error: any) {
        console.error("uploadFileToMediaLibrary error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};


/* -------------------------------------------------------------------------- */
/*                                  GET USER                                  */
/* -------------------------------------------------------------------------- */

export const getUserInfo = async (
    authToken: string,
    userId: string
): Promise<ApiResponse<UserData>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data,
        };
    } catch (error: any) {
        console.error("getUserInfo error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};

/* -------------------------------------------------------------------------- */
/*                         GET LOCATION USERS (AGENTS)                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                       SETUP CUSTOM FIELDS (Kleegr Travels)                */
/* -------------------------------------------------------------------------- */

const CUSTOM_FOLDER_NAME = "Kleegr Travels";

export const setupCustomFields = async (
    locationId: string,
    customFieldNames: Array<{ key: string; field_value?: string }>,
    accessToken: string
): Promise<CustomFieldsData[]> => {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Version: "2021-07-28",
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    let folderId: string | undefined;

    // Step 1: Get all custom fields to find our folder
    try {
        const allFieldsRes = await axios.get(
            `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
            { headers }
        );
        const allData = allFieldsRes?.data?.customFields || [];
        console.log(`[setupCustomFields] Total fields fetched: ${allData.length}`);

        // Find folder by name (response fields vary a bit, so be defensive)
        const isFolder = (f: any) =>
            f?.dataType === "FOLDER" ||
            f?.dataType === "folder" ||
            f?.type === "FOLDER" ||
            f?.data_type === "FOLDER";

        const folder = allData.find((f: any) => f?.name === CUSTOM_FOLDER_NAME && isFolder(f));
        if (folder) {
            folderId = folder.id;
            console.log(`[setupCustomFields] Found folder "${CUSTOM_FOLDER_NAME}" with id: ${folderId}`);
        }
    } catch (err: any) {
        console.error("[setupCustomFields] Error fetching fields:", err.response?.data || err.message);
    }

    // Step 2: Create folder if not found
    if (!folderId) {
        try {
            console.log(`[setupCustomFields] Creating folder "${CUSTOM_FOLDER_NAME}"...`);
            const folderRes = await axios.post(
                `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
                { name: CUSTOM_FOLDER_NAME, dataType: "FOLDER", model: "contact" },
                { headers }
            );
            folderId =
                folderRes?.data?.customField?.id ||
                folderRes?.data?.customField?.customField?.id ||
                folderRes?.data?.id ||
                undefined;
            console.log(`[setupCustomFields] Folder created with id: ${folderId}`);
        } catch (err: any) {
            console.error("[setupCustomFields] Error creating folder:", err.response?.data || err.message);
            // Try alternative response shape
            return [];
        }
    }

    if (!folderId) {
        // Fallback: refetch and find folder by name again.
        try {
            const refetch = await axios.get(
                `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
                { headers }
            );
            const allData2 = refetch?.data?.customFields || [];
            const isFolder = (f: any) =>
                f?.dataType === "FOLDER" ||
                f?.dataType === "folder" ||
                f?.type === "FOLDER" ||
                f?.data_type === "FOLDER";
            const folder2 = allData2.find((f: any) => f?.name === CUSTOM_FOLDER_NAME && isFolder(f));
            folderId = folder2?.id;
        } catch (refetchErr: any) {
            console.error("[setupCustomFields] Could not refetch folder id:", refetchErr.response?.data || refetchErr.message);
        }

        if (!folderId) {
            console.error("[setupCustomFields] Could not get or create folder, aborting.");
            return [];
        }
    }

    // Step 3: Get existing fields in the folder
    let existingFields: any[] = [];
    try {
        const allFieldsRes = await axios.get(
            `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
            { headers }
        );
        const allData = allFieldsRes?.data?.customFields || [];
        existingFields = allData.filter((f: any) => f.parentId === folderId);
        console.log(`[setupCustomFields] Existing fields in folder: ${existingFields.map((f: any) => f.name).join(', ') || 'none'}`);
    } catch (err: any) {
        console.error("[setupCustomFields] Error fetching fields in folder:", err.response?.data || err.message);
    }

    // Step 4: Create or match each field
    const created: CustomFieldsData[] = [];

    for (const field of customFieldNames) {
        const { key, field_value } = field;

        const existing = existingFields.find((f: any) => f.name === key);
        if (existing) {
            created.push({
                id: existing.id,
                name: existing.name,
                fieldKey: existing.fieldKey,
                field_value: String(field_value ?? ""),
            });
            continue;
        }

        try {
            console.log(`[setupCustomFields] Creating field "${key}" in folder ${folderId}...`);
            const desiredDataType = (() => {
                switch (key) {
                    case "Departure Date":
                    case "Return Date":
                        return "DATE";
                    case "Passengers":
                        return "NUMBER";
                    case "VIP Client":
                        return "BOOLEAN";
                    default:
                        return "TEXT";
                }
            })();

            let fieldRes: any = null;
            try {
                fieldRes = await axios.post(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
                    {
                        name: key,
                        dataType: desiredDataType,
                        model: "contact",
                        parentId: folderId,
                    },
                    { headers }
                );
            } catch (createErr: any) {
                // If GHL doesn't support the desired datatype, fall back to TEXT.
                if (desiredDataType !== "TEXT") {
                    fieldRes = await axios.post(
                        `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
                        {
                            name: key,
                            dataType: "TEXT",
                            model: "contact",
                            parentId: folderId,
                        },
                        { headers }
                    );
                } else {
                    throw createErr;
                }
            }
            // Response shape can vary; try common keys.
            const newField =
                fieldRes?.data?.customField ||
                fieldRes?.data?.customFields?.[0] ||
                fieldRes?.data?.data?.customField ||
                null;

            if (newField?.id) {
                created.push({
                    id: newField.id,
                    name: newField.name,
                    fieldKey: newField.fieldKey,
                    field_value: String(field_value ?? ""),
                });
                console.log(`[setupCustomFields] Created field "${key}" → id: ${newField.id}, fieldKey: ${newField.fieldKey}`);
            } else {
                // Fallback: refetch fields and match by name.
                try {
                    const allFieldsRes2 = await axios.get(
                        `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
                        { headers }
                    );
                    const allData2 = allFieldsRes2?.data?.customFields || [];
                    const matched = allData2.find((f: any) => f.parentId === folderId && f.name === key);
                    if (matched?.id) {
                        created.push({
                            id: matched.id,
                            name: matched.name,
                            fieldKey: matched.fieldKey,
                            field_value: String(field_value ?? ""),
                        });
                        console.log(`[setupCustomFields] Field "${key}" found after create → id: ${matched.id}`);
                    }
                } catch (refetchErr: any) {
                    console.error(`[setupCustomFields] Could not refetch field "${key}" after create:`, refetchErr.response?.data || refetchErr.message);
                }
            }
        } catch (error: any) {
            console.error(`[setupCustomFields] Error creating field "${key}":`, error.response?.data || error.message);
        }
    }

    console.log(`[setupCustomFields] Total fields prepared: ${created.length}`);
    return created;
};

/* -------------------------------------------------------------------------- */
/*                         GET CUSTOM FIELDS                                  */
/* -------------------------------------------------------------------------- */

export const getCustomFields = async (
    locationId: string,
    accessToken: string
): Promise<any[]> => {
    try {
        const res = await axios.get(
            `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Version: "2021-07-28",
                },
            }
        );
        return res.data.customFields || [];
    } catch (err: any) {
        console.error("Error fetching custom fields:", err.message);
        return [];
    }
};

/* -------------------------------------------------------------------------- */
/*                         GET LOCATION USERS (AGENTS)                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                              TAGS                                         */
/* -------------------------------------------------------------------------- */

// GET all tags for a location
export const getLocationTags = async (ghl: GHLAuth): Promise<ApiResponse<any>> => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/locations/${ghl.locationId}/tags`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );
        return { success: true, status: 200, data: response.data?.tags || [] };
    } catch (error: any) {
        console.error("getLocationTags error:", error.response?.data || error.message);
        return { success: false, status: error.response?.status || 500, data: error.response?.data || error.message };
    }
};

// ADD tags to a contact
export const addContactTags = async (ghl: GHLAuth, contactId: string, tags: string[]): Promise<ApiResponse<any>> => {
    try {
        const response = await axios.post(
            `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
            { tags },
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );
        return { success: true, status: 200, data: response.data };
    } catch (error: any) {
        console.error("addContactTags error:", error.response?.data || error.message);
        return { success: false, status: error.response?.status || 500, data: error.response?.data || error.message };
    }
};

// REMOVE tags from a contact
export const removeContactTags = async (ghl: GHLAuth, contactId: string, tags: string[]): Promise<ApiResponse<any>> => {
    try {
        const response = await axios.delete(
            `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                data: { tags },
            }
        );
        return { success: true, status: 200, data: response.data };
    } catch (error: any) {
        console.error("removeContactTags error:", error.response?.data || error.message);
        return { success: false, status: error.response?.status || 500, data: error.response?.data || error.message };
    }
};

export const getLocationUsers = async (ghl: GHLAuth) => {
    try {
        const response = await axios.get(
            `https://services.leadconnectorhq.com/users/?locationId=${ghl.locationId}`,
            {
                headers: {
                    Authorization: `Bearer ${ghl.access_token}`,
                    Version: "2021-07-28",
                    Accept: "application/json",
                },
            }
        );

        return {
            success: true,
            status: 200,
            data: response.data,
        };
    } catch (error: any) {
        console.error("getLocationUsers error:", error.response?.data || error.message);
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || error.message,
        };
    }
};
