"use client"
/* eslint-disable */

import { useEffect, useState } from 'react';
import crypto from 'crypto-js';

const SsoHandler = () => {
    const [ssodata, setssodata] = useState('');

    const decript_data = async (payload: any, app: any) => {
        let ciphertext = await crypto.AES.decrypt(payload, app.key).toString(crypto.enc.Utf8);
        console.log(ciphertext);
        setssodata(ciphertext);
    };
    // const decript_data = async (payload: any, app: any) => {
    //     console.log(payload, app, 'payloadpayloadpayloadpayload');
    //     let ciphertext = await crypto.AES.decrypt("U2FsdGVkX19t113UNkcGB8/DDpsZ67rxFIatC6TMp7gWFQeKpdwWdgTQm9DdgcMwFbzczXaXesCJ/nVdoPqCou9ArweO1q3zoKukiiV+G7pmG4tCLLvNQQzEbiusZFxqMZOyv0Nnrd+PWkZxJXyh67wuBrlyJhA4j3P5fFUXW1HrOptg5bGaLWKhXdt6Ov+UjNoT3cfiN4QQyz16os+4jqLdRp30R3MC7f8POJx48ubiDunf2dm/ohc/43E8gm3/75F35ZtmXrP5Y2g+rbYkg2Af+MIdIsd8MDXJ0heNnp6RqlLTYURuQ2pnWBZJKasb0EkJ5weLBc0awZPivazyeXpFe9nvbwK4MO+e6f+4mvcZ748be8uWZLWd6TM0fIO9fKeu3+kcYXR5vrCwivdJzK6CUCwLvJJAub+GjmRO80KyHYCQs0ooOvrzBA8avKs5UOC7LGa3TUdN4ZLrg5hjQw==", "a9a440cb-a46c-4179-8d1a-5b2a2b58ce2c").toString(crypto.enc.Utf8);
    //     console.log(ciphertext);
    //     setssodata(ciphertext);
    // };
    const checkSSO = (sso: any) => {
        const key = new Promise((resolve) => {

            window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');
            const temp = window.addEventListener('message', ({ data }) => {
                if (true) {
                    // if (data.message === 'REQUEST_USER_DATA_RESPONSE') {
                    console.log(data.payload, sso, 'sso');
                    decript_data(data.payload, sso);
                } else {
                }
                // console.log(temp, 'temptemptemptemptemptemp')
            });
        });
    };
    return {
        SSO: ssodata,
        checkSSO: checkSSO,
    };
};
export default SsoHandler;
