describe('Vue example app', () => {
    it('can load the landing page', () => {
        cy.visit('/')
    });
    
    describe('Home page', () => {
        beforeEach(() => {
            cy.visit('/');
        })
    })
    
})