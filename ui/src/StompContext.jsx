import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'

const StompContext = createContext(null)

export function StompProvider({ children }) {
    const clientRef = useRef(null)
    // topic -> { stompSub, callback } — stores both so we can re-subscribe on reconnect
    const activeSubsRef = useRef(new Map())
    // topic -> callback — queued while not yet connected
    const pendingSubsRef = useRef(new Map())

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const brokerURL = `${protocol}//${window.location.host}/ws-market`

        const client = new Client({
            brokerURL,
            reconnectDelay: 2000,
            onConnect: () => {
                // Re-subscribe active subs that were invalidated by a connection drop
                activeSubsRef.current.forEach(({ callback }, topic) => {
                    const stompSub = client.subscribe(topic, callback)
                    activeSubsRef.current.set(topic, { stompSub, callback })
                })
                // Subscribe topics that were queued before first connect
                pendingSubsRef.current.forEach((callback, topic) => {
                    const stompSub = client.subscribe(topic, callback)
                    activeSubsRef.current.set(topic, { stompSub, callback })
                })
                pendingSubsRef.current.clear()
            },
        })

        client.activate()
        clientRef.current = client
        return () => client.deactivate()
    }, [])

    const subscribe = useCallback((topic, callback) => {
        const client = clientRef.current
        if (client?.connected) {
            const stompSub = client.subscribe(topic, callback)
            activeSubsRef.current.set(topic, { stompSub, callback })
        } else {
            pendingSubsRef.current.set(topic, callback)
        }
    }, [])

    const unsubscribe = useCallback((topic) => {
        activeSubsRef.current.get(topic)?.stompSub?.unsubscribe()
        activeSubsRef.current.delete(topic)
        pendingSubsRef.current.delete(topic)
    }, [])

    return (
        <StompContext.Provider value={{ subscribe, unsubscribe }}>
            {children}
        </StompContext.Provider>
    )
}

export const useStomp = () => useContext(StompContext)
