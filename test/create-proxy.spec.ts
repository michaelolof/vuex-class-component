// @ts-ignore
import Vuex, {Store} from 'vuex'
// @ts-ignore
import { createLocalVue } from '@vue/test-utils'
import { Module, VuexModule } from '../src/module'
import { getter } from '../src/getters'
import { mutation } from '../src/mutations'
import { action } from '../src/actions'


interface Name {
	firstname:string
	lastname:string
}

@Module({ namespacedPath: 'user/settings/' })
class UserSettings extends VuexModule{
	@getter cookieConsent = false

	@mutation changeConsent(consent: boolean) {
		this.cookieConsent = consent
	}
}


@Module({ namespacedPath: 'user/' })
class UserStore extends VuexModule {
	settings = UserSettings.CreateSubModule(UserSettings)

	firstname = 'Michael'
	lastname = 'Olofinjana'
	@getter specialty = 'JavaScript' // The @getter decorator automatically exposes a defined state as a getter.
	@getter occupation = 'Developer'

	@mutation changeName({firstname, lastname}:Name) {
		this.firstname = firstname
		this.lastname = lastname
	}

	@action async doSomethingAsync() { return 20 }

	@action async doAnotherAsyncStuff(payload:any) {
		const number = await this.doSomethingAsync()
		this.changeName({ firstname: 'John', lastname: 'Doe' })
		return payload + this.fullName
	}

	// Explicitly define a vuex getter using class getters.
	get fullName() {
		return this.firstname + ' ' + this.lastname
	}
}

describe('CreateProxy', () => {
	let store;
	let localVue;
	beforeEach(() => {
		localVue = createLocalVue()
		localVue.use(Vuex)
		store = new Store({
			modules: {
				user: UserStore.ExtractVuexModule(UserStore)
			}
		})
	})

	it('should proxy getters', () => {
		const user = UserStore.CreateProxy(store, UserStore)

		expect(user.fullName).toEqual('Michael Olofinjana')
		expect(user.specialty).toEqual('JavaScript')
		expect(user.occupation).toEqual('Developer')
	})

	it('should proxy state', () => {
		const user = UserStore.CreateProxy(store, UserStore)

		expect(user.firstname).toEqual('Michael')
		expect(user.lastname).toEqual('Olofinjana')
	})

	it('should proxy actions', async () => {
		const user = UserStore.CreateProxy(store, UserStore)

		await user.doAnotherAsyncStuff('Something')

		expect(user.fullName).toEqual('John Doe')

		expect(user.firstname).toEqual('John')
		expect(user.lastname).toEqual('Doe')
	})

	it('should proxy mutations', async () => {
		const user = UserStore.CreateProxy(store, UserStore)

		await user.changeName({ firstname: 'Ola', lastname: 'Nordmann' })

		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
	})
})
