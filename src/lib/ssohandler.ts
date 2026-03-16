"use client"
/* eslint-disable */

import { useEffect, useState, useRef } from 'react';
import crypto from 'crypto-js';

const SsoHandler = () => {
    const [ssodata, setssodata] = useState('');
    const listenerRef = useRef(false);

    const decript_data = (payload: string, app: { key: string }) => {
        try {
            const ciphertext = crypto.AES.decrypt(payload, app.key).toString(crypto.enc.Utf8);
            if (ciphertext) {
                console.log("SSO decrypted successfully");
                setssodata(ciphertext);
            } else {
                console.warn("SSO decryption returned empty string");
            }
        } catch (e) {
            console.error("SSO decryption failed:", e);
        }
    };

    const checkSSO = (sso: { app_id: string; key: string }) => {
        // Prevent duplicate listeners
        if (listenerRef.current) return;
        listenerRef.current = true;

        // Request SSO data from parent (GHL iframe)
        try {
            window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');
        } catch (e) {
            console.warn("Not in iframe context, SSO unavailable");
            return;
        }

        window.addEventListener('message', ({ data }) => {
            // Only handle the SSO response, ignore other messages
            if (data?.message === 'REQUEST_USER_DATA_RESPONSE' && data?.payload) {
                decript_data(data.payload, sso);
            }
        });
    };

    return {
        SSO: ssodata,
        checkSSO,
    };
};
export default SsoHandler;
