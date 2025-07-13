describe('Vue example app', () => {
    it('can load the landing page', () => {
        cy.visit('/')
    });
    
    it('Renders home-page content from Vue', () => {
        cy.visit('/');
        cy.contains('h1', 'Home');
    })
})