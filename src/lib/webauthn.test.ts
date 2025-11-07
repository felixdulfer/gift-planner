import { describe, expect, it } from 'vitest'
import { credentialToJSON, isWebAuthnSupported } from './webauthn'

// Helper to create a mock ArrayBuffer
function createMockArrayBuffer(data: number[]): ArrayBuffer {
    const buffer = new ArrayBuffer(data.length)
    const view = new Uint8Array(buffer)
    data.forEach((byte, index) => {
        view[index] = byte
    })
    return buffer
}

// Helper to convert ArrayBuffer to base64url (for testing)
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

describe('webauthn', () => {
    describe('isWebAuthnSupported', () => {
        it('should return true when WebAuthn is supported', () => {
            // Mock browser environment
            global.window = {
                PublicKeyCredential:
                    {} as unknown as typeof PublicKeyCredential,
            } as Window & typeof globalThis
            global.navigator = {
                credentials: {} as CredentialsContainer,
            } as Navigator

            expect(isWebAuthnSupported()).toBe(true)
        })

        it('should return false when window is undefined', () => {
            const originalWindow = global.window
            // @ts-expect-error - testing SSR scenario
            delete global.window

            expect(isWebAuthnSupported()).toBe(false)

            global.window = originalWindow
        })

        it('should return false when PublicKeyCredential is undefined', () => {
            global.window = {
                PublicKeyCredential: undefined,
            } as unknown as Window & typeof globalThis
            global.navigator = {
                credentials: {} as CredentialsContainer,
            } as Navigator

            expect(isWebAuthnSupported()).toBe(false)
        })
    })

    describe('arrayBufferToBase64URL', () => {
        it('should convert ArrayBuffer to base64url', () => {
            const buffer = createMockArrayBuffer([72, 101, 108, 108, 111]) // "Hello"
            const base64url = arrayBufferToBase64URL(buffer)
            expect(typeof base64url).toBe('string')
            expect(base64url).not.toContain('+')
            expect(base64url).not.toContain('/')
            expect(base64url).not.toContain('=')
        })
    })

    describe('credentialToJSON', () => {
        it('should convert PublicKeyCredential to JSON format', () => {
            const mockClientDataJSON = createMockArrayBuffer([1, 2, 3])
            const mockAttestationObject = createMockArrayBuffer([4, 5, 6])
            const mockRawId = createMockArrayBuffer([7, 8, 9])

            const mockCredential = {
                id: 'test-credential-id',
                rawId: mockRawId,
                type: 'public-key',
                response: {
                    clientDataJSON: mockClientDataJSON,
                    attestationObject: mockAttestationObject,
                } as AuthenticatorAttestationResponse,
            } as PublicKeyCredential

            const result = credentialToJSON(mockCredential)

            expect(result).toEqual({
                id: 'test-credential-id',
                rawId: expect.any(String),
                type: 'public-key',
                response: {
                    clientDataJSON: expect.any(String),
                    attestationObject: expect.any(String),
                },
            })
        })

        it('should handle AuthenticatorAssertionResponse', () => {
            const mockClientDataJSON = createMockArrayBuffer([1, 2, 3])
            const mockAuthenticatorData = createMockArrayBuffer([4, 5, 6])
            const mockSignature = createMockArrayBuffer([7, 8, 9])
            const mockRawId = createMockArrayBuffer([10, 11, 12])

            const mockCredential = {
                id: 'test-credential-id',
                rawId: mockRawId,
                type: 'public-key',
                response: {
                    clientDataJSON: mockClientDataJSON,
                    authenticatorData: mockAuthenticatorData,
                    signature: mockSignature,
                } as AuthenticatorAssertionResponse,
            } as PublicKeyCredential

            const result = credentialToJSON(mockCredential)

            expect(result).toEqual({
                id: 'test-credential-id',
                rawId: expect.any(String),
                type: 'public-key',
                response: {
                    clientDataJSON: expect.any(String),
                    authenticatorData: expect.any(String),
                    signature: expect.any(String),
                },
            })
        })

        it('should handle userHandle when present', () => {
            const mockClientDataJSON = createMockArrayBuffer([1, 2, 3])
            const mockUserHandle = createMockArrayBuffer([4, 5, 6])
            const mockRawId = createMockArrayBuffer([7, 8, 9])

            const mockCredential = {
                id: 'test-credential-id',
                rawId: mockRawId,
                type: 'public-key',
                response: {
                    clientDataJSON: mockClientDataJSON,
                    userHandle: mockUserHandle,
                } as AuthenticatorAssertionResponse,
            } as PublicKeyCredential

            const result = credentialToJSON(mockCredential)

            expect(result.response.userHandle).toBeDefined()
            expect(typeof result.response.userHandle).toBe('string')
        })

        it('should not include userHandle when not present', () => {
            const mockClientDataJSON = createMockArrayBuffer([1, 2, 3])
            const mockRawId = createMockArrayBuffer([7, 8, 9])

            const mockCredential = {
                id: 'test-credential-id',
                rawId: mockRawId,
                type: 'public-key',
                response: {
                    clientDataJSON: mockClientDataJSON,
                } as AuthenticatorAssertionResponse,
            } as PublicKeyCredential

            const result = credentialToJSON(mockCredential)

            expect(result.response.userHandle).toBeUndefined()
        })
    })
})
