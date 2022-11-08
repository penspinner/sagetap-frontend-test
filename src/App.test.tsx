import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved,
  waitFor,
} from '@testing-library/react'
import { App, ArtItem } from './App'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { ToastProvider, ToastViewport } from './toast'

const server = setupServer()

beforeAll(() => {
  server.listen()
})

afterAll(() => {
  server.close()
})

// We should be mocking the fetch for the artworks in these tests, but the tests don't say to do so
// unlike the last test.

test('has title', () => {
  render(<App />)
  const title = screen.getByText('Art Rater')
  expect(title).toBeInTheDocument()
})

test('for an art item, submit button is disabled until a rating is selected', async () => {
  render(<ArtItem id={27992} onRemove={jest.fn()} />)
  await waitForElementToBeRemoved(() => screen.queryByText('Loading artwork...'))
  expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  fireEvent.click(screen.getByRole('radio', { name: '1' }))
  expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled()
})

test('for an art item, clicking numbered button updates rating display below image to be that number', async () => {
  render(<ArtItem id={27992} onRemove={jest.fn()} />)
  await waitForElementToBeRemoved(() => screen.queryByText('Loading artwork...'))
  fireEvent.click(screen.getByRole('radio', { name: '1' }))
  expect(screen.getByText('Rating: 1')).toBeInTheDocument()
})

test('for an art item, clicking numbered button updates rating display below image to be that number, clicking two different numbers one after the other', async () => {
  render(<ArtItem id={27992} onRemove={jest.fn()} />)
  await waitForElementToBeRemoved(() => screen.queryByText('Loading artwork...'))
  fireEvent.click(screen.getByRole('radio', { name: '1' }))
  fireEvent.click(screen.getByRole('radio', { name: '2' }))
  expect(screen.queryByText('Rating: 1')).not.toBeInTheDocument()
  expect(screen.getByText('Rating: 2')).toBeInTheDocument()
})

test('for an art item, clicking submit POSTs update, displays a toast success message, hides buttons', async () => {
  // The endpoint and payload for the submit button can be found in the submit method in `App.tsx`.
  // For the purpose of this test, please use a mock function instead.
  render(
    <ToastProvider>
      <ArtItem id={27992} onRemove={jest.fn()} />
      <ToastViewport />
    </ToastProvider>,
  )
  await waitForElementToBeRemoved(() => screen.queryByText('Loading artwork...'))
  expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  fireEvent.click(screen.getByRole('radio', { name: '1' }))
  server.use(
    rest.post('https://v0867.mocklab.io/rating', (req, res, ctx) => {
      return res(ctx.json({ message: 'Successfully rated' }))
    }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

  await waitFor(() =>
    ['1', '2', '3', '4', '5'].forEach((buttonName) => {
      expect(screen.queryByRole('button', { name: buttonName })).not.toBeInTheDocument()
    }),
  )
  expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  const toastMessage = await screen.findByText('Successfully rated')
  expect(toastMessage).toBeInTheDocument()
})
