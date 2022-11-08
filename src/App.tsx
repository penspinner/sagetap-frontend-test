import * as React from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { ToastProvider, ToastViewport, Toast } from './toast'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { Artwork } from './artwork'

type Art = {
  id: number
}

export const App = () => {
  const [arts, setArts] = React.useState<Art[]>([
    { id: 27992 },
    { id: 27998 },
    { id: 27999 },
    { id: 27997 },
    { id: 27993 },
  ])
  const [fieldError, setFieldError] = React.useState('')

  return (
    <ToastProvider duration={10000}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-center text-2xl">Art Rater</h1>
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {arts.map((art) => (
            <ArtItem
              key={art.id}
              id={art.id}
              onRemove={(id) => setArts(arts.filter((art) => art.id !== id))}
            />
          ))}
        </ul>
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget as HTMLFormElement)
            const artId = data.get('artId')

            if (typeof artId !== 'string') {
              return
            }

            if (Number.isNaN(+artId)) {
              setFieldError('Art ID must be a number.')
              return
            }

            event.currentTarget.reset()
            setArts([...arts, { id: +artId }])
          }}
        >
          <div className="w-80">
            <label htmlFor="artId" className="block text-sm font-medium text-gray-700">
              Art ID
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="number"
                  name="artId"
                  required
                  id="artId"
                  className="block w-full appearance-none rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-describedby="artIdError"
                  aria-invalid={fieldError ? 'true' : undefined}
                />
              </div>
              <button
                type="submit"
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span className="whitespace-nowrap">Add Art</span>
              </button>
            </div>
            {fieldError && (
              <p className="mt-2 text-sm text-red-600" id="artIdError">
                {fieldError}
              </p>
            )}
          </div>
        </form>
      </main>
      <ToastViewport />
    </ToastProvider>
  )
}

type Fetcher<Data, Err> =
  | {
      state: 'idle'
      data: undefined
    }
  | {
      state: 'loading'
    }
  | {
      state: 'error'
      error: Error | Err
    }
  | {
      state: 'success'
      data: Data
    }

type ArtRatingFetcher = Fetcher<string, string[] | string>

type ArtFetcher = Fetcher<Artwork, { status: number; error: string; detail: string }>

export const ArtItem = ({ id, onRemove }: { id: number; onRemove: (id: number) => void }) => {
  const [rating, setRating] = React.useState<number | undefined>(undefined)
  const [artFetcher, setArtFetcher] = React.useState<ArtFetcher>({ state: 'idle', data: undefined })
  const [artRatingFetcher, setArtRatingFetcher] = React.useState<ArtRatingFetcher>({
    state: 'idle',
    data: undefined,
  })

  React.useEffect(() => {
    setArtFetcher({ state: 'loading' })
    getArtwork(id)
      .then((response) => response.json())
      .then((result: Artwork | { status: number; error: string; detail: string }) => {
        if ('error' in result) {
          setArtFetcher({ state: 'error', error: result })
        } else {
          setArtFetcher({ state: 'success', data: result })
        }
      })
      .catch((reason) => setArtFetcher({ state: 'error', error: reason }))
  }, [id])

  if (artFetcher.state === 'loading' || artFetcher.state === 'idle') {
    return (
      <li className="rounded-lg bg-slate-200 p-4 shadow">
        <p>Loading artwork...</p>
      </li>
    )
  }

  const removeButton = (
    <button className="text-sm text-indigo-800" onClick={() => onRemove(id)}>
      Remove Art
    </button>
  )

  if (artFetcher.state === 'error') {
    return (
      <li className="rounded-lg bg-slate-200 p-4 shadow">
        <details className="text-red-600">
          <summary>An error occurred while loading Art ID: {id}</summary>
          <p>
            {artFetcher.error instanceof Error ? artFetcher.error.message : artFetcher.error.detail}
          </p>
        </details>
        <div className="mt-4">{removeButton}</div>
      </li>
    )
  }

  const submit = () => {
    setArtRatingFetcher({ state: 'loading' })
    fetch('https://v0867.mocklab.io/rating', {
      body: JSON.stringify({ id, rating }),
      method: 'POST',
    })
      .then((response) => response.json())
      .then((result: { message: string } | { errors: string[] }) => {
        if ('message' in result) {
          setArtRatingFetcher({ state: 'success', data: result.message })
        } else if ('errors' in result) {
          setArtRatingFetcher({ state: 'error', error: result.errors })
        } else {
          setArtRatingFetcher({
            state: 'error',
            error: new Error(`Unhandled error with data: ${result}`),
          })
        }
      })
      .catch((reason) => setArtRatingFetcher({ state: 'error', error: reason }))
  }

  return (
    <li className="rounded-lg bg-slate-100 p-4 shadow">
      <h2 className="text-lg font-semibold">{artFetcher.data.data.title}</h2>
      <h3 className="mt-1 text-sm text-gray-700">{artFetcher.data.data.artist_title}</h3>
      <img
        className="w-100 mt-6"
        src={getImageUrl(artFetcher.data.data.image_id)}
        alt={artFetcher.data.data.title}
      />
      <p className="mt-4">Rating: {rating}</p>
      {artRatingFetcher.state !== 'success' && (
        <div className="mt-4 flex">
          <ToggleGroup.Root
            type="single"
            onValueChange={(value) => setRating(value === '' ? undefined : +value)}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <ToggleGroup.Item
                className="relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus-visible:z-10 focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 enabled:hover:bg-gray-50 disabled:opacity-60"
                disabled={artRatingFetcher.state === 'loading'}
                key={number}
                value={`${number}`}
              >
                {number}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          <button
            className="relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus-visible:z-10 focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 enabled:hover:bg-gray-50 disabled:opacity-60"
            disabled={rating === undefined || artRatingFetcher.state === 'loading'}
            onClick={() => submit()}
          >
            {artRatingFetcher.state === 'loading' ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
      <div className="mt-4">{removeButton}</div>
      {artRatingFetcher.state === 'success' ? (
        <Toast type="success" description={artRatingFetcher.data} />
      ) : artRatingFetcher.state === 'error' ? (
        <Toast
          type="error"
          description={
            Array.isArray(artRatingFetcher.error)
              ? artRatingFetcher.error.join(' ')
              : artRatingFetcher.error.toString()
          }
        />
      ) : null}
    </li>
  )
}

const getArtwork = async (id: number) => {
  return fetch('https://api.artic.edu/api/v1/artworks/' + id)
}

const getImageUrl = (id: string) => {
  return 'https://www.artic.edu/iiif/2/' + id + '/full/843,/0/default.jpg'
}
