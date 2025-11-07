// WebAuthn utility functions

export interface PublicKeyCredentialCreationOptionsJSON {
    rp: {
        name: string
        id?: string
    }
    user: {
        id: string
        name: string
        displayName: string
    }
    challenge: string
    pubKeyCredParams: Array<{
        type: string
        alg: number
    }>
    timeout?: number
    excludeCredentials?: Array<{
        id: string
        type: string
        transports?: string[]
    }>
    authenticatorSelection?: {
        authenticatorAttachment?: string
        requireResidentKey?: boolean
        userVerification?: 'required' | 'preferred' | 'discouraged'
    }
    attestation?: 'none' | 'indirect' | 'direct'
}

export interface WebAuthnSession {
    sessionId: string
    session:
        | PublicKeyCredentialCreationOptionsJSON
        | PublicKeyCredentialRequestOptionsJSON
}

export interface PublicKeyCredentialRequestOptionsJSON {
    challenge: string
    timeout?: number
    rpId?: string
    allowCredentials?: Array<{
        id: string
        type: string
        transports?: string[]
    }>
    userVerification?: 'required' | 'preferred' | 'discouraged'
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        typeof navigator.credentials !== 'undefined'
    )
}

/**
 * Convert base64url string to ArrayBuffer
 */
function base64URLToArrayBuffer(base64url: string): ArrayBuffer {
    if (!base64url || typeof base64url !== 'string') {
        throw new Error('Invalid base64url string: expected a non-empty string')
    }
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/**
 * Convert WebAuthn options to format expected by browser API
 */
function convertToPublicKeyCredentialCreationOptions(
    options: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
    if (!options.challenge) {
        throw new Error(
            'Invalid WebAuthn options: challenge is required but was undefined',
        )
    }
    if (!options.user?.id) {
        throw new Error(
            'Invalid WebAuthn options: user.id is required but was undefined',
        )
    }

    // Ensure rp.name is set (required by WebAuthn spec)
    // Default to a generic name if not provided
    const rp = options.rp?.name
        ? options.rp
        : { name: 'Gift Planner', id: options.rp?.id }

    // Ensure pubKeyCredParams is set (required by WebAuthn spec)
    // Default to ES256 (-7) and RS256 (-257) for maximum compatibility
    const pubKeyCredParams = options.pubKeyCredParams?.length
        ? options.pubKeyCredParams
        : [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 }, // RS256
          ]

    return {
        ...options,
        rp,
        challenge: base64URLToArrayBuffer(options.challenge),
        user: {
            ...options.user,
            id: base64URLToArrayBuffer(options.user.id),
        },
        pubKeyCredParams,
        excludeCredentials: options.excludeCredentials?.map((cred) => ({
            ...cred,
            id: base64URLToArrayBuffer(cred.id),
            type: cred.type as 'public-key',
            transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
        authenticatorSelection: options.authenticatorSelection
            ? {
                  ...options.authenticatorSelection,
                  authenticatorAttachment: options.authenticatorSelection
                      .authenticatorAttachment as
                      | AuthenticatorAttachment
                      | undefined,
              }
            : undefined,
    } as PublicKeyCredentialCreationOptions
}

function convertToPublicKeyCredentialRequestOptions(
    options: PublicKeyCredentialRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
    if (!options.challenge) {
        throw new Error(
            'Invalid WebAuthn options: challenge is required but was undefined',
        )
    }

    return {
        ...options,
        challenge: base64URLToArrayBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred) => ({
            ...cred,
            id: base64URLToArrayBuffer(cred.id),
            type: cred.type as 'public-key',
            transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
    }
}

/**
 * Begin WebAuthn registration
 */
export async function beginRegistration(
    userId: string,
    beginRegistrationFn: (userId: string) => Promise<WebAuthnSession>,
): Promise<WebAuthnSession> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser')
    }

    const session = await beginRegistrationFn(userId)
    return session
}

/**
 * Finish WebAuthn registration
 */
export async function finishRegistration(
    _sessionId: string,
    session: PublicKeyCredentialCreationOptionsJSON,
): Promise<PublicKeyCredential> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser')
    }

    if (!session) {
        throw new Error('Session options are required but were undefined')
    }

    console.log('Session options received:', {
        hasChallenge: !!session.challenge,
        hasUser: !!session.user,
        challenge: session.challenge,
        user: session.user,
        hasPubKeyCredParams: !!session.pubKeyCredParams,
        pubKeyCredParams: session.pubKeyCredParams,
        hasRp: !!session.rp,
        rp: session.rp,
    })

    const publicKey = convertToPublicKeyCredentialCreationOptions(session)

    const credential = (await navigator.credentials.create({
        publicKey,
    })) as PublicKeyCredential | null

    if (!credential) {
        throw new Error('Failed to create credential')
    }

    return credential
}

/**
 * Begin WebAuthn login
 */
export async function beginLogin(
    userId: string,
    beginLoginFn: (userId: string) => Promise<WebAuthnSession>,
): Promise<WebAuthnSession> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser')
    }

    const session = await beginLoginFn(userId)
    return session
}

/**
 * Finish WebAuthn login
 */
export async function finishLogin(
    _sessionId: string,
    session: PublicKeyCredentialRequestOptionsJSON,
): Promise<PublicKeyCredential> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser')
    }

    const publicKey = convertToPublicKeyCredentialRequestOptions(session)

    const credential = (await navigator.credentials.get({
        publicKey,
    })) as PublicKeyCredential | null

    if (!credential) {
        throw new Error('Failed to get credential')
    }

    return credential
}

/**
 * Convert credential response to format expected by backend
 */
export function credentialToJSON(credential: PublicKeyCredential): {
    id: string
    rawId: string
    response: {
        clientDataJSON: string
        attestationObject?: string
        authenticatorData?: string
        signature?: string
        userHandle?: string
    }
    type: string
} {
    const response = credential.response as
        | AuthenticatorAttestationResponse
        | AuthenticatorAssertionResponse

    const result: {
        id: string
        rawId: string
        response: {
            clientDataJSON: string
            attestationObject?: string
            authenticatorData?: string
            signature?: string
            userHandle?: string
        }
        type: string
    } = {
        id: credential.id,
        rawId: arrayBufferToBase64URL(credential.rawId),
        response: {
            clientDataJSON: arrayBufferToBase64URL(response.clientDataJSON),
        },
        type: credential.type,
    }

    if ('attestationObject' in response) {
        result.response.attestationObject = arrayBufferToBase64URL(
            response.attestationObject,
        )
    }

    if ('authenticatorData' in response) {
        result.response.authenticatorData = arrayBufferToBase64URL(
            response.authenticatorData,
        )
    }

    if ('signature' in response) {
        result.response.signature = arrayBufferToBase64URL(response.signature)
    }

    if ('userHandle' in response && response.userHandle) {
        // userHandle should be an ArrayBuffer, convert it to base64url
        const userHandle = response.userHandle as unknown
        if (userHandle instanceof ArrayBuffer) {
            result.response.userHandle = arrayBufferToBase64URL(userHandle)
        } else if (userHandle instanceof Uint8Array) {
            // Create a new ArrayBuffer from the Uint8Array
            const buffer = userHandle.buffer.slice(
                userHandle.byteOffset,
                userHandle.byteOffset + userHandle.byteLength,
            ) as ArrayBuffer
            result.response.userHandle = arrayBufferToBase64URL(buffer)
        } else {
            // If it's already a string (shouldn't happen per spec, but handle it)
            // Convert the string to ArrayBuffer first, then to base64url
            const encoder = new TextEncoder()
            const bytes = encoder.encode(String(userHandle))
            result.response.userHandle = arrayBufferToBase64URL(bytes.buffer)
        }
    }

    return result
}
