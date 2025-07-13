describe('Vue example app', () => {
    it('can load the landing page', () => {
        cy.visit('/')
    });
    
    describe('Home page', () => {
        beforeEach(() => {
            cy.visit('/');
        })
        
        it('Renders a main heading from React', () => {
            cy.contains('div', 'Welcome to Meteor');
        });
        
        it('Renders Meteor resources', () => {
            cy.contains('h2', 'Learn Meteor!')
        })
        
        it('Renders navigation links', () => {
            cy.get('a').contains('https://www.meteor.com/tutorials');
        });
        
        it('Rendered a form to add links', () => {
            cy.get('form').contains('Add');
        })
    })
    
})