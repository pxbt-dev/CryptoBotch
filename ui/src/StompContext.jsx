import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'

const StompContext = createContext(null)

export function StompProvider({ children }) {
    const clientRef = useRef(null)
    // Single authoritative registry: topic -> { callback, stompSub }
    // stompSub is null when not yet connected or after a connection drop
    const subsRef = useRef(new Map())

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const brokerURL = `${protocol}//${window.location.host}/ws-market`

        const client = new Client({
            brokerURL,
            reconnectDelay: 2000,
            onConnect: () => {
                // Subscribe everything that doesn't have an active stompSub yet.
                // Covers both the initial connect and reconnects after a drop.
                subsRef.current.forEach((entry, topic) => {
                    if (!entry.stompSub) {
                        entry.stompSub = client.subscribe(topic, entry.callback)
                    }
                })
            },
            onWebSocketClose: () => {
                // Invalidate all stompSubs — the session is gone.
                // onConnect will re-create them when the connection restores.
                subsRef.current.forEach(entry => { entry.stompSub = null })
            },
        })

        client.activate()
        clientRef.current = client
        return () => {
            subsRef.current.forEach(entry => { entry.stompSub = null })
            client.deactivate()
        }
    }, [])

    const subscribe = useCallback((topic, callback) => {
        const entry = { callback, stompSub: null }
        subsRef.current.set(topic, entry)
        const client = clientRef.current
        if (client?.connected) {
            entry.stompSub = client.subscribe(topic, callback)
        }
        // If not connected, onConnect will pick it up when the connection is ready
    }, [])

    const unsubscribe = useCallback((topic) => {
        const entry = subsRef.current.get(topic)
        if (entry) {
            try { entry.stompSub?.unsubscribe() } catch (_) { /* session may already be closed */ }
            subsRef.current.delete(topic)
        }
    }, [])

    return (
        <StompContext.Provider value={{ subscribe, unsubscribe }}>
            {children}
        </StompContext.Provider>
    )
}

export const useStomp = () => useContext(StompContext)
