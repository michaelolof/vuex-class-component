import { getter, Module, mutation, VuexModule } from '../src/index'
import { action } from '../src/actions'

interface Name {
	firstname:string
	lastname:string
}

@Module()
class UserSettings extends VuexModule{
	@getter cookieConsent = false

	@mutation changeConsent(consent: boolean) {
		this.cookieConsent = consent
	}
}

@Module({ namespacedPath: 'user/' })
class UserStore extends VuexModule {
	settings = UserSettings.CreateSubModule(UserSettings)

	private firstname = 'Michael'
	private lastname = 'Olofinjana'
	@getter speciality = 'JavaScript' // The @getter decorator automatically exposes a defined state as a getter.
	@getter occupation = 'Developer'

	@mutation changeName({firstname, lastname}:Name) {
		this.firstname = firstname
		this.lastname = lastname
	}

	@action async doSomethingAsync() { return 20 }

	@action async doAnotherAsyncStuff(payload) {
		const number = await this.doSomethingAsync()
		this.changeName({ firstname: 'John', lastname: 'Doe' })
		return payload + this.fullName
	}

	// Explicitly define a vuex getter using class getters.
	get fullName() {
		return this.firstname + ' ' + this.lastname
	}
}

describe('ExtractVuexModule', () => {
	it('should extract all properties as state', () => {
		const { state } = UserStore.ExtractVuexModule(UserStore)

		expect(state).toEqual({
				firstname: 'Michael',
				lastname: 'Olofinjana',
				speciality: 'JavaScript',
				occupation: 'Developer'
			})
		expect(state).not.toHaveProperty('settings')
	})

	it('should extract all properties as state in a function for target => nuxt', () => {
		const { state } = UserStore.ExtractVuexModule( UserStore, "nuxt" );
		expect( typeof state ).toBe( "function" );
		expect( state() ).toEqual({
			firstname: "Michael",
			lastname: "Olofinjana",
			speciality: "JavaScript",
			occupation: "Developer"
		});
		expect( state ).not.toHaveProperty( "settings" );
	})

	it('should extract all getters', () => {
		const { getters } = UserStore.ExtractVuexModule(UserStore)

		expect(Object.keys(getters)).toEqual(['speciality', 'occupation', 'fullName'])
	})

	it('should extract all actions', () => {
		const { actions } = UserStore.ExtractVuexModule(UserStore)

		expect(Object.keys(actions)).toEqual(['doSomethingAsync', 'doAnotherAsyncStuff'])
	})

	it('should extract all mutations', () => {
		const { mutations } = UserStore.ExtractVuexModule(UserStore)

		expect(Object.keys(mutations)).toEqual(['changeName'])
	})

	it('should extract if module is namespaced or not', () => {
		expect(UserStore.ExtractVuexModule(UserStore)).toHaveProperty('namespaced', true)
		expect(UserSettings.ExtractVuexModule(UserSettings)).toHaveProperty('namespaced', false)
	})

	it('should extract submodules', () => {
		const { modules } = UserStore.ExtractVuexModule(UserStore)

		expect(Object.keys(modules)).toEqual(['settings'])
	})
})

