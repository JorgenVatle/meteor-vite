describe('Vue example app', () => {
    it('can load the landing page', () => {
        cy.visit('/')
    });
    
    describe('Home page', () => {
        beforeEach(() => {
            cy.visit('/');
        })
        it('Renders a main heading from Vue', () => {
            cy.contains('h1', 'Home');
        });
        
        it('Renders navigation links', () => {
            cy.contains('a');
        })
        
        it('Renders active Vue router links', () => {
            cy.get('.router-link-active');
        });
        
        it('Renders home page links as active', () => {
            cy.get('.router-link-active').contains('Home');
        });
    })
    
})