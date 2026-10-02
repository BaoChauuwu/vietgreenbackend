export const generateWelcome = (
	fullName: string,
	email: string,
	password: string,
) => {
	return `
		<h3>Welcome to Our System</h3>
		<p>Hello <strong>${fullName}</strong>,</p>
		<p>Your account has been created successfully.</p>

		<p><strong>Login Information:</strong></p>
		<ul>
			<li>Email: ${email}</li>
			<li>Password: ${password}</li>
		</ul>

		<p>You can log in here:</p>
		<p><a href="#" target="_blank">Login Now</a></p>

		<br/>
		<p>Thank you,</p>
		<p>The Support Team</p>
	`;
};
