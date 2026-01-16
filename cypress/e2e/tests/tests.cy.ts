// cypress/e2e/tests.cy.ts
describe('E2E Tests', () => {
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
            cy.get('input[placeholder="Bevestig wachtwoord"]').should('be.visible');
        });

        it('should validate username (minimum 3 characters)', () => {
            cy.get('input[placeholder="Gebruikersnaam"]').type('ab');
            cy.get('input[placeholder="E-mailadres"]').type('test@example.com');
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('input[placeholder="Bevestig wachtwoord"]').type('Password123!');
            cy.get('.register-button').click();

            cy.get('.error-message').should('contain', 'Gebruikersnaam moet minstens 3 tekens bevatten');
        });

        it('should validate email format', () => {
            cy.get('input[placeholder="Gebruikersnaam"]').type('testuser');
            cy.get('input[placeholder="E-mailadres"]').type('invalid-email');
            cy.get('input[placeholder="Wachtwoord"]').type('Password123!');
            cy.get('input[placeholder="Bevestig wachtwoord"]').type('Password123!');
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
                cy.get('input[placeholder="Bevestig wachtwoord"]').clear().type(password)
                cy.get('.register-button').click();
                cy.get('.error-message').should('contain', error);
            });
        });

        it('should successfully register with valid credentials', () => {
            const timestamp = Date.now();
            const username = `testuser${timestamp}`;
            const email = `test${timestamp}@example.com`;
            const password = Cypress.env('testPassword');

            cy.task('saveCredentials', { email, password, username });

            cy.intercept('POST', '**/auth/register').as('registerRequest');

            cy.get('input[placeholder="Gebruikersnaam"]').type(username);
            cy.get('input[placeholder="E-mailadres"]').type(email);
            cy.get('input[placeholder="Wachtwoord"]').type(password);
            cy.get('input[placeholder="Bevestig wachtwoord"]').type(password)
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
            cy.url().should('include', 'reason=expired_token');
            cy.url().should('include', 'message=Sessie%20verlopen');
        });

        it('should successfully login with valid credentials', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                cy.intercept('POST', '**/auth/login').as('loginRequest');

                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
                cy.url().should('include', '/studentenprofiel');
            });
        });

        it('should have Microsoft login button', () => {
            cy.get('.login-button-microsoft').should('be.visible');
            cy.get('.login-button-microsoft').should('contain', 'Inloggen met Microsoft');
        });

        it('should redirect new user to profile page before accessing VKMs', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                // Login
                cy.visit('/login');
                cy.intercept('POST', '**/auth/login').as('loginRequest');

                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

                cy.url().should('include', '/studentenprofiel');
                cy.get('.intro-modal').should('be.visible');
                cy.get('.intro-modal').should('contain', 'Welkom bij je profiel');

                // Close welcome modal
                cy.get('.intro-modal button').contains('Begrepen').click();

                // Wait for select-elements
                cy.get('.ai-select').should('have.length', 3);
                cy.wait(500);

                // en dan change event triggeren
                cy.get('.ai-select').eq(0).then((select) => {
                    // Select "Business & Innovatie"
                    cy.wrap(select).find('option').contains('Business & Innovatie').then(($option) => {
                        $option.prop('selected', true);
                    });
                    // Trigger change event on the select element
                    cy.wrap(select).trigger('change', { force: true });
                });

                cy.wait(300);

                cy.get('.ai-select').eq(1).then((select) => {
                    // Select "Innovatie"
                    cy.wrap(select).find('option').contains('Innovatie').then(($option) => {
                        $option.prop('selected', true);
                    });
                    cy.wrap(select).trigger('change', { force: true });
                });

                cy.wait(300);

                cy.get('.ai-select').eq(2).then((select) => {
                    // Select "Nieuwe vaardigheden ontwikkelen"
                    cy.wrap(select).find('option').contains('Nieuwe vaardigheden ontwikkelen').then(($option) => {
                        $option.prop('selected', true);
                    });
                    cy.wrap(select).trigger('change', { force: true });
                });

                cy.wait(500);

                // Intercept profile save
                cy.intercept('PUT', '**/auth/me/profile').as('saveProfile');

                // Save profile
                cy.get('.ai-save-btn').click();

                cy.wait('@saveProfile').its('response.statusCode').should('eq', 200);

                // Success modal should appear
                cy.get('.intro-modal').should('contain', 'Voorkeuren opgeslagen!');

                cy.get('.intro-modal button').contains('Naar homepagina').click();

                cy.url().should('eq', Cypress.config().baseUrl + '/');
                cy.visit('/vkms');
                cy.get('.vkms-page').should('be.visible');
            });
        });
    });

    describe('Favorites (Detail Page)', () => {
        beforeEach(() => {
            cy.clearLocalStorage();
            cy.clearCookies();
        });

        it('should favorite a VKM from detail page and verify in account', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                // Login
                cy.visit('/login');
                cy.intercept('POST', '**/auth/login').as('loginRequest');
                cy.intercept('GET', '**/auth/me').as('getUser');

                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
                cy.wait('@getUser');
                cy.url().should('include', '/vkms');

                // Click first VKM detail button
                cy.get('.vkm-card .btn-detail').first().click();

                // Wait for detail page
                cy.url().should('match', /\/vkms\/[a-f0-9]+$/);
                cy.get('.vkm-detail').should('be.visible');

                // Store VKM name before favoriting
                cy.get('.info-box p').first().invoke('text').then((vkmInfo) => {
                    const cleanVkmName = vkmInfo.replace(/Naam:\s*/, '').trim();

                    // Intercept favorite request
                    cy.intercept('POST', '**/auth/users/favorites/**').as('addFavorite');

                    // Click favorite button
                    cy.get('.favorite-buttons button').contains('Voeg toe aan favorieten').click();

                    cy.wait('@addFavorite').its('response.statusCode').should('eq', 200);

                    // Verify button changed
                    cy.get('.favorite-buttons button').should('contain', 'Verwijder uit favorieten');

                    // Navigate to account page
                    cy.visit('/account');
                    cy.get('.favorites-card').should('be.visible');

                    // Verify VKM in favorites
                    cy.get('.favorites-card .favorite-item span').should('contain', cleanVkmName);
                });
            });
        });

        it('should unfavorite a VKM from account page', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                // Login
                cy.visit('/login');
                cy.intercept('POST', '**/auth/login').as('loginRequest');
                cy.intercept('GET', '**/auth/me').as('getUser');


                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest');
                cy.wait('@getUser');

                // Navigate to account page
                cy.visit('/account');

                // Wait for favorites to load
                cy.get('.favorites-card').should('be.visible');

                // Get first favorite name
                cy.get('.favorite-item').first().invoke('text').then((favoriteText) => {
                    // Intercept unfavorite request
                    cy.intercept('DELETE', '**/auth/users/favorites/**').as('removeFavorite');

                    // Click unfavorite button
                    cy.get('.favorite-item').first().find('.unfavorite-btn').click();

                    cy.wait('@removeFavorite').its('response.statusCode').should('eq', 200);

                    // Verify success message
                    cy.get('.alert-success').should('contain', 'Module verwijderd');

                    // Verify removed from list
                    cy.get('.favorites-card').should('not.contain', favoriteText.split('SP')[0].trim());
                });
            });
        });
    });

    describe('Favorites (Swipe Page)', () => {
        beforeEach(() => {
            cy.clearLocalStorage();
            cy.clearCookies();
        });

        it('should favorite a VKM from swipe page and verify in account', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                // Login
                cy.visit('/login');
                cy.intercept('POST', '**/auth/login').as('loginRequest');
                cy.intercept('GET', '**/auth/me').as('getUser');

                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
                cy.wait('@getUser');
                // Navigate to swipe page
                cy.visit('/swipe');
                cy.get('.swipe-page').should('be.visible');

                // Wait for modal to appear and close it
                cy.get('.intro-modal').should('be.visible');
                cy.get('.intro-modal button').contains('Begrepen!').click();

                // Get current VKM name from the card
                let vkmNameToFavorite = '';
                cy.get('.vkm-info-card h4').first().invoke('text').then((name) => {
                    vkmNameToFavorite = name.trim();
                    cy.log('VKM to favorite: ' + vkmNameToFavorite);

                    // Intercept favorite request
                    cy.intercept('POST', '**/auth/users/favorites/**').as('addFavorite');

                    // Click heart button to swipe right (last button)
                    cy.get('.swipe-actions button').last().click();

                    cy.wait('@addFavorite').its('response.statusCode').should('eq', 200);

                    // Navigate to account page
                    cy.visit('/account');

                    // Wait for favorites card to load
                    cy.get('.favorites-card').should('be.visible');

                    // Verify VKM in favorites
                    cy.get('.favorites-card .favorite-item span').first().should('contain', vkmNameToFavorite);
                });
            });
        });

        it('should unfavorite a VKM from swipe page favorites', () => {
            cy.task('getCredentials').then((credentials: any) => {
                if (!credentials) {
                    cy.log('No credentials available, skipping test');
                    return;
                }

                // Login
                cy.visit('/login');
                cy.intercept('POST', '**/auth/login').as('loginRequest');
                cy.intercept('GET', '**/auth/me').as('getUser');

                cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest');
                cy.wait('@getUser');
                // Navigate to account page
                cy.visit('/account');

                // Wait for favorites card to load
                cy.get('.favorites-card').should('be.visible');

                // Ensure at least one favorite exists
                cy.get('.favorites-card .favorite-item').should('have.length.greaterThan', 0);

                // Get first favorite name from span
                cy.get('.favorites-card .favorite-item span').first().invoke('text').then((favoriteName) => {
                    const cleanFavoriteName = favoriteName.trim();

                    // Intercept unfavorite request
                    cy.intercept('DELETE', '**/auth/users/favorites/**').as('removeFavorite');

                    // Click unfavorite button on first favorite
                    cy.get('.favorites-card .favorite-item').first().find('.unfavorite-btn').click();

                    cy.wait('@removeFavorite').its('response.statusCode').should('eq', 200);

                    // Verify success message
                    cy.get('.alert-success').should('contain', 'Module verwijderd');

                    // Verify removed from list
                    cy.get('.favorites-card').should('not.contain', cleanFavoriteName.split('SP')[0].trim());
                });
            });
        });
    });

    describe('Cleanup - Delete Account', () => {
        beforeEach(() => {
            cy.clearLocalStorage();
            cy.clearCookies();
        });

        describe('Cleanup - Delete Account', () => {
            it('should delete the test account after all tests', () => {
                cy.task('getCredentials').then((credentials: any) => {
                    if (!credentials) {
                        cy.log('No credentials available, skipping cleanup');
                        return;
                    }

                    // Login first
                    cy.visit('/login');
                    cy.intercept('POST', '**/auth/login').as('loginRequest');
                    cy.intercept('GET', '**/auth/me').as('getUser');

                    cy.get('input[placeholder="E-mailadres"]').type(credentials.email);
                    cy.get('input[placeholder="Wachtwoord"]').type(credentials.password);
                    cy.get('.login-button').click();

                    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
                    cy.wait('@getUser');
                    // Navigate to account page
                    cy.visit('/account');

                    // Wait for account page to load
                    cy.get('h2').contains('Account Configurator').should('be.visible');
                    cy.wait(500);

                    // Intercept delete request
                    cy.intercept('DELETE', '**/auth/me').as('deleteAccount');

                    // Find and click delete button - "Account verwijderen"
                    cy.get('button').contains('Account verwijderen').click({ force: true });

                    // Handle confirmation modal
                    cy.get('[role="dialog"]').should('be.visible');
                    cy.get('[role="dialog"]').find('button').contains('Verwijderen').click();

                    // Wait for deletion
                    cy.wait('@deleteAccount').its('response.statusCode').should('be.oneOf', [200, 204]);

                    // Should be redirected to error page (since token is now invalid)
                    cy.url().should('include', '/error');
                    cy.url().should('include', 'status=401');

                    cy.log('Test account successfully deleted');
                });
            });
        });
    })
});