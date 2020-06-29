// @ts-ignore
import Vuex, {Store} from 'vuex'
// @ts-ignore
import { createLocalVue } from '@vue/test-utils'
import { getter, mutation, action, getRawActionContext, createModule, createProxy, clearProxyCache, createSubModule, extractVuexModule } from '../src'


interface Name {
	firstname:string
	lastname:string
}

class UserSettings extends createModule({ namespaced: 'user/settings/' }) {
	@getter cookieConsent = false

	@mutation changeConsent(consent: boolean) {
		this.cookieConsent = consent
	}
}

class Something extends createModule({ namespaced: 'user/something/' }) {
	something = 'nothing'
	nested = {
		test: "test",
		deep: {
			test: "deep test",
			valid: true
		}
	}
}

class Books extends createModule({ namespaced: 'books/' }) {
	books: string[] = []

	@mutation addBook(book: string) {
		this.books.push(book)
	}
}

class UserStore extends createModule({ namespaced: 'user/', strict: false })  {

	settings = createSubModule(UserSettings)
	something = createSubModule(Something)

	firstname = 'Michael'
	lastname = 'Olofinjana'
	nullField: string | null = null
	description = {
		fingers: 10,
		arms: 2,
		hungry: true,
		head: {
			eyes: 2,
			hairs: "brown"
		}
	}
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

	@action({ mode: 'raw'}) async rawAction() {
		const context = getRawActionContext( this );
		context.commit("changeName", { firstname: 'Ola', lastname: 'Nordmann' });
	}

	@action({ mode: 'mutate' }) async access$store() {
		return this.$store.state.globalValue
	}

	@action async addBook(book: string) {
		const booksProxy = createProxy(this.$store, Books)
		booksProxy.addBook(book)
	}

	// Explicitly define a vuex getter using class getters.
	get fullName() {
		return this.firstname + ' ' + this.lastname
	}

	get valueFrom$store() {
		return this.$store.state.globalValue;
	}

	get getValueFromGetter() {
		this.fullName //?
		return 'Fullname is: ' + this.fullName
	}
}

describe('CreateProxy', () => {
	
	let store;
	let localVue;

	beforeEach(() => {
		localVue = createLocalVue()
		localVue.use(Vuex)
		store = new Store({
			strict: true,
			modules: {
				...extractVuexModule(UserStore)
			}
		})
	})

	afterEach(() => {
		clearProxyCache(UserStore)
	})

	it('should proxy getters', () => {
		const user = createProxy(store, UserStore);

		expect(user.fullName).toEqual('Michael Olofinjana')
		expect(user.specialty).toEqual('JavaScript')
		expect(user.occupation).toEqual('Developer')
	})

	it('should proxy state', () => {
		const user = createProxy(store, UserStore)

		expect(user.firstname).toEqual('Michael')
		expect(user.lastname).toEqual('Olofinjana')
		expect(user.nullField).toEqual(null)
	})

	it('should proxy actions', async () => {

		const user = createProxy(store, UserStore)

		await user.doAnotherAsyncStuff('Something')

		expect(user.fullName).toEqual('John Doe')

		expect(user.firstname).toEqual('John')
		expect(user.lastname).toEqual('Doe')

		await user.rawAction()


		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
	})

	it('should proxy mutations', async () => {
		const user = createProxy(store, UserStore)

		await user.changeName({ firstname: 'Ola', lastname: 'Nordmann' })

		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
	})

	it('should proxy non-strict setter in strict mode', () => {
		const user = createProxy(store, UserStore)

		expect(user.firstname).toEqual('Michael')
		expect(user.lastname).toEqual('Olofinjana')
		expect(user.nullField).toEqual(null)

		user.firstname = 'Ola'
		user.lastname = 'Nordmann'
		user.nullField = 'not null'
		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
		expect(user.nullField).toEqual('not null')
	})

	it('should proxy objects recursively', () => {
		const user = createProxy(store, UserStore)

		expect(user.description.arms).toEqual(2)
		expect(user.description.fingers).toEqual(10)
		expect(user.description.hungry).toEqual(true)
		expect(user.description.head.eyes).toEqual(2)
		expect(user.description.head.hairs).toEqual("brown")

		user.description.hungry = false
		expect(user.description.hungry).toEqual(false)

		user.description.head.hairs = "blond"
		expect(user.description.head.hairs).toEqual("blond")
	})

	it('should proxy submodule', () => {
		const user = createProxy(store, UserStore)

		expect(user.settings.cookieConsent).toEqual(false)
		expect(user.something.something).toEqual("nothing")
		expect(user.something.nested.test).toEqual("test")
		expect(user.something.nested.deep.test).toEqual("deep test")
		expect(user.something.nested.deep.valid).toEqual(true)

		user.settings.changeConsent(true)
		expect(user.settings.cookieConsent).toEqual(true)

		user.something.something = "more than nothing"
		expect(user.something.something).toEqual("more than nothing")

		user.something.nested.test = "nested change"
		expect(user.something.nested.test).toEqual("nested change")

		user.something.nested.deep.test = "nested deep change"
		user.something.nested.deep.valid = false
		expect(user.something.nested.deep.test).toEqual("nested deep change")
		expect(user.something.nested.deep.valid).toEqual(false)
	})

})