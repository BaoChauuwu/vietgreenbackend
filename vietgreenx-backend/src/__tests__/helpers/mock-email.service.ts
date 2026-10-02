export const createMockEmailService = () => ({
	sendMail: jest.fn().mockResolvedValue(undefined),
});

export type MockEmailService = ReturnType<typeof createMockEmailService>;
