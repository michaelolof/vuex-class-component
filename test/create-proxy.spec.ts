// @ts-ignore
import Vuex, {Store} from 'vuex'
// @ts-ignore
import { createLocalVue } from '@vue/test-utils'
import { Module, VuexModule } from '../src/module'
import { getter } from '../src/getters'
import { mutation } from '../src/mutations'
import { action, getRawActionContext } from '../src/actions'


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

@Module({ namespacedPath: 'user/something/'})
class Something extends VuexModule {
	something = 'nothing'
}

@Module({ namespacedPath: 'books/' })
class Books extends VuexModule{
	books: string[] = []

	@mutation addBook(book: string) {
		this.books.push(book)
	}
}

@Module({ namespacedPath: 'user/' })
class UserStore extends VuexModule {
	settings = UserSettings.CreateSubModule(UserSettings)
	something = Something.CreateSubModule(Something)

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

	@action({ mode: 'raw'}) async rawAction() {
		const context = getRawActionContext( this );
		context.commit("changeName", { firstname: 'Ola', lastname: 'Nordmann' });
	}

	@action({ mode: 'mutate' }) async access$store() {
		return this.$store.state.globalValue
	}

	@action async addBook(book: string) {
		const booksProxy = Books.CreateProxy(this.$store, Books)
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
			modules: {
				user: UserStore.ExtractVuexModule(UserStore)
			}
		})
	})

	afterEach(() => {
		UserStore.ClearProxyCache(UserStore)
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

		await user.rawAction()


		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
	})

	it('should proxy mutations', async () => {
		const user = UserStore.CreateProxy(store, UserStore)

		await user.changeName({ firstname: 'Ola', lastname: 'Nordmann' })

		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')
	})

	it('should proxy submodules', () => {
		const user = UserStore.CreateProxy(store, UserStore)

		expect(user.settings.cookieConsent).toEqual(false)
		user.settings.changeConsent(true)
		expect(user.settings.cookieConsent).toEqual(true)

		expect(user.something.something).toEqual('nothing')
	})

	it('should reset state for each time you call clear cache', async () => {
		let user = UserStore.CreateProxy(store, UserStore)
		await user.changeName({ firstname: 'Ola', lastname: 'Nordmann' })

		expect(user.fullName).toEqual('Ola Nordmann')

		expect(user.firstname).toEqual('Ola')
		expect(user.lastname).toEqual('Nordmann')

		// Reset cache and create new store
		UserStore.ClearProxyCache(UserStore)
		localVue = createLocalVue()
		localVue.use(Vuex)
		store = new Store({
			modules: {
				user: UserStore.ExtractVuexModule(UserStore)
			}
		})

		user = UserStore.CreateProxy(store, UserStore)

		expect(user.fullName).toEqual('Michael Olofinjana')

		expect(user.firstname).toEqual('Michael')
		expect(user.lastname).toEqual('Olofinjana')
	})

	it('should create proxy inside module', async () => {
		UserStore.ClearProxyCache(UserStore)
		localVue = createLocalVue()
		localVue.use(Vuex)
		store = new Store({
			modules: {
				user: UserStore.ExtractVuexModule(UserStore),
				books: Books.ExtractVuexModule(Books)
			}
		})

		const user = UserStore.CreateProxy(store, UserStore)
		const books = Books.CreateProxy(store, Books)

		expect(books.books).toEqual([])
		await user.addBook('My new book')
		expect(books.books).toContain('My new book')
	})

	it('should provide store instance on $store field', async () => {
		UserStore.ClearProxyCache(UserStore)
		localVue = createLocalVue()
		localVue.use(Vuex)
		store = new Store({
			modules: {
				user: UserStore.ExtractVuexModule(UserStore)
			},
			state: {
				globalValue: 'someValue accessible from store'
			}
		})

		const user = UserStore.CreateProxy(store, UserStore)

		expect(user.valueFrom$store).toEqual('someValue accessible from store')
		await expect(user.access$store()).resolves.toEqual('someValue accessible from store')
	})

	it('should be able to access other getters inside a getter', () => {
		const user = UserStore.CreateProxy(store, UserStore)

		expect(user.fullName).toEqual('Michael Olofinjana')
		expect(user.getValueFromGetter).toEqual('Fullname is: Michael Olofinjana')
	})
})
