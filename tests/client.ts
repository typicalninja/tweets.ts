import {RestClient} from '../index';
import { expect } from 'chai'

describe('Request Client', () => {
	it('Should Error When Necessary options are not given', () => {
		expect(() => new RestClient({ authorization: {} })).to.throw()
	});

	it('Should retrieve the bearerToken for a Account', (done) => {
		new RestClient({
			type: 'app',
			authorization: {
				consumer_key: 'D2KjgSywIu1hyDPOGTYX6nUXG',
				consumer_secret: '9h2mbl0NChUjQCxGYy1UlCNvmBF5XjU2QEjXLXVZJjRwtgqggE'
			}
		}).getBearerToken().then((result) => {
			expect(typeof result).to.be.eql('string')
			done()
		});
	})

})

// 1238451949000888322-2yB7F6olQlGWwsfbSx3iuGH7AU2FCd
//s - tld4TIbZ5RKbM5jtdt2Lq3xeQ28qhVavWKZ4gHbka7nSu