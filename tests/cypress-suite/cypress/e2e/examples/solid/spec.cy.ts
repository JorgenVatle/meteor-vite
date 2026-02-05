describe('Solid example app', () => {
    it('can load the landing page', () => {
        cy.visit('/')
    });
    
    describe('Home page', () => {
        beforeEach(() => {
            cy.visit('/');
        })
        it('Renders a main heading', () => {
            cy.contains('h1', 'Meteor');
        });
    })
    
})