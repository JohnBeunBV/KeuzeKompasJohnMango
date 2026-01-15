// cypress/e2e/auth.cy.ts
describe('Authentication Tests', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    describe('Registration', () => {
        beforeEach(() => {
            cy.visit('/register');
        });

        it('should display registration form', () => {
            cy.get('.register-card').should('be.visible');
            cy.get('.register-title').should('contain', 'Maak een account aan');
            cy.get('input[placeholder="Gebruikersnaam"]').should('be.visible');
            cy.get('input[placeholder="E-mailadres"]').should('be.visible');
            cy.get('input[placeholder="Wachtwoord"]').should('be.visible');
        });

        it('should validate username (minimum 3 characters)', () => {
            cy.get('input[placeholder="Gebruikersnaam"]').type('ab');
            cy.get('input[placeholder="E-mailadres"]').type('test@example.com');
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('.register-button').click();

            cy.get('.error-message').should('contain', 'Gebruikersnaam moet minstens 3 tekens bevatten');
        });

        it('should validate email format', () => {
            cy.get('input[placeholder="Gebruikersnaam"]').type('testuser');
            cy.get('input[placeholder="E-mailadres"]').type('invalid-email');
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('.register-button').click();

            // Test op de native browser validatie
            cy.get('input[placeholder="E-mailadres"]')
                .invoke('prop', 'validationMessage')
                .should('not.be.empty');
        });

        it('should validate password requirements', () => {
            const testCases = [
                { password: 'short1!', error: 'minimaal 8 tekens' },
                { password: 'nouppercase1!', error: 'minstens één hoofdletter' },
                { password: 'NoNumber!', error: 'minstens één cijfer' },
                { password: 'NoSymbol123', error: 'minstens één symbool' }
            ];

            testCases.forEach(({ password, error }) => {
                cy.get('input[placeholder="Gebruikersnaam"]').clear().type('testuser');
                cy.get('input[placeholder="E-mailadres"]').clear().type('test@example.com');
                cy.get('input[placeholder="Wachtwoord"]').clear().type(password);
                cy.get('.register-button').click();
                cy.get('.error-message').should('contain', error);
            });
        });

        it('should successfully register with valid credentials', () => {
            const timestamp = Date.now();
            const username = `testuser${timestamp}`;
            const email = `test${timestamp}@example.com`;

            cy.intercept('POST', '**/auth/register').as('registerRequest');

            cy.get('input[placeholder="Gebruikersnaam"]').type(username);
            cy.get('input[placeholder="E-mailadres"]').type(email);
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('.register-button').click();

            cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
            cy.get('.success-message').should('contain', 'Registratie succesvol');
            cy.url().should('include', '/login', { timeout: 3000 });
        });

        it('should navigate to login page when clicking login link', () => {
            cy.get('.register-link').click();
            cy.url().should('include', '/login');
        });
    });

    describe('Login', () => {
        beforeEach(() => {
            cy.visit('/login');
        });

        it('should display login form', () => {
            cy.get('.login-card').should('be.visible');
            cy.get('.login-title').should('contain', 'Welkom terug');
            cy.get('input[placeholder="E-mailadres"]').should('be.visible');
            cy.get('input[placeholder="Wachtwoord"]').should('be.visible');
        });

        it('should show error with invalid credentials', () => {
            cy.intercept('POST', '**/auth/login', {
                statusCode: 401,
                body: { error: 'Login mislukt' }
            }).as('loginRequest');

            cy.get('input[placeholder="E-mailadres"]').type('wrong@example.com');
            cy.get('input[placeholder="Wachtwoord"]').type('WrongPassword123!');
            cy.get('.login-button').click();

            cy.wait('@loginRequest');

            // Test op redirect naar error pagina
            cy.url().should('include', '/error');
            cy.url().should('include', 'status=401');
            cy.url().should('include', 'message=Login%20mislukt');
        });

        it('should successfully login with valid credentials', () => {
            cy.intercept('POST', '**/auth/login', {
                statusCode: 200,
                body: {
                    user: { username: 'testuser', email: 'test@example.com' }
                }
            }).as('loginRequest');

            cy.get('input[placeholder="E-mailadres"]').type('test@example.com');
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('.login-button').click();

            cy.wait('@loginRequest').then(() => {
            });

            cy.url().should('include', '/vkms');
        });

        it('should have Microsoft login button', () => {
            cy.get('.login-button-microsoft').should('be.visible');
            cy.get('.login-button-microsoft').should('contain', 'Inloggen met Microsoft');
        });
    });
});