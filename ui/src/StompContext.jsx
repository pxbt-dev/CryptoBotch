import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'

const StompContext = createContext(null)

export function StompProvider({ children }) {
    const clientRef = useRef(null)
    const activeSubsRef = useRef(new Map())  // topic -> stomp subscription
    const pendingSubsRef = useRef(new Map()) // topic -> callback (queued before connect)

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const brokerURL = `${protocol}//${window.location.host}/ws-market`

        const client = new Client({
            brokerURL,
            reconnectDelay: 2000,
            onConnect: () => {
                pendingSubsRef.current.forEach((callback, topic) => {
                    activeSubsRef.current.set(topic, client.subscribe(topic, callback))
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
            activeSubsRef.current.set(topic, client.subscribe(topic, callback))
        } else {
            pendingSubsRef.current.set(topic, callback)
        }
    }, [])

    const unsubscribe = useCallback((topic) => {
        activeSubsRef.current.get(topic)?.unsubscribe()
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
