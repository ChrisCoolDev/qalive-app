import { vi } from 'vitest'

// Global mocks for testing
vi.stubGlobal('confirm', vi.fn(() => true))
