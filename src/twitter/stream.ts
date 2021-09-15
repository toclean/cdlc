// Open a realtime stream of Tweets, filtered according to rules
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start

import needle from 'needle';
import { EventEmitter } from 'events';  

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=id,author_id&user.fields=username';

import { event, Twitter } from '../index';
import { Interaction, Snowflake, TextBasedChannels } from 'discord.js';
import { token } from './creds';

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

async function getAllRules() {

    const response = await needle('get', rulesURL, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}

async function deleteAllRules(rules: any) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map((rule: any) => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}

async function deleteRule(rules: any, username: string) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.filter((rule: any) => rule.tag === username).map((rule: any) => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}

async function setRules(rules: object[]) {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return (response.body);

}

function streamConnect(retryAttempt: number, channel: TextBasedChannels) {

    const stream = needle.get(streamURL, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000,
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);
            console.log(`https://twitter.com/${json.data.author_id}/status/${json.data.id}`);
            channel.send(`https://twitter.com/${json.data.author_id}/status/${json.data.id}`);
            // event.emit('tweet', channel?.send(`https://twitter.com/${json.data.author_id}/status/${json.data.id}`));
            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            console.log(data);
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream. 
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt, channel);
            }, 2 ** retryAttempt)
        }
    });

    return stream;

}


export async function doShit(interaction: Interaction, usernames: string[], twitterMap: Map<Snowflake, Twitter>,
    channel: TextBasedChannels) {
    let currentRules;

    if (!interaction.guildId) return;

    const rules = usernames.map((username) => {
        return {
            value: `${username} -is:retweet -is:reply -is:quote`,
            tag: username
        };
    });

    console.log(rules);

    try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();

        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules(rules);

        const twitter = twitterMap.get(interaction.guildId);

        if (twitter) {
            if (!twitter.hasStream) {
                twitterMap.set(interaction.guildId, {
                    atList: twitter.atList,
                    hasStream: true
                });

                streamConnect(0, channel);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

export async function removeRule(interaction: Interaction, username: string) {
    try {
        // Gets the complete list of rules currently applied to the stream
        let currentRules = await getAllRules();

        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteRule(currentRules, username);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules(currentRules);
    } catch (e) {
        console.error(e);
    }
}