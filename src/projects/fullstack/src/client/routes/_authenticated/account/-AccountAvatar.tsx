import type {Area, Point} from 'react-easy-crop'
import type {ImageLoadingStatus} from '@/client/types'

import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Button} from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import {Input} from '@/client/components/ui/input'
import {Label} from '@/client/components/ui/label'
import {Separator} from '@/client/components/ui/separator'
import {Slider} from '@/client/components/ui/slider'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {
  apiAuthClientAtom,
  userAvatarUrlSelector,
  userAvatarVersionAtom,
  userInitialsAtom,
} from '@/client/state/globalState'
import {maxAvatarUploadSize} from '@/shared/constants'

import {bytesToSize} from '@qodestack/utils'
import {useMutation} from '@tanstack/react-query'
import {useRouteContext} from '@tanstack/react-router'
import {DetailedError, parseResponse} from 'hono/client'
import {useAtomValue, useSetAtom} from 'jotai'
import {ZoomInIcon, ZoomOutIcon} from 'lucide-react'
import {useCallback, useEffect, useId, useRef, useState} from 'react'
import Cropper from 'react-easy-crop'
import {toast} from 'sonner'

const minZoom = 1
const maxZoom = 3

export function AccountAvatar() {
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })
  const initials = useAtomValue(userInitialsAtom)
  const [emailName, emailDomain] = user.email.split('@')

  const [showImage, setShowImage] = useState(true)
  const [imageLoadingStatus, setImageLoadingStatus] =
    useState<ImageLoadingStatus>('idle')
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null)
  const selectedFileRef = useRef<File | null>(null)
  const [crop, setCrop] = useState<Point>({x: 0, y: 0})
  const [zoom, setZoom] = useState(minZoom)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputId = useId()
  const apiAuthClient = useAtomValue(apiAuthClientAtom)
  const logClientError = useLogClientError()
  const setUserAvatarVersion = useSetAtom(userAvatarVersionAtom)
  const userAvatarUrl = useAtomValue(userAvatarUrlSelector)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const clearPreview = () => {
    if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    setBlobPreviewUrl(null)
    selectedFileRef.current = null
    setCrop({x: 0, y: 0})
    setZoom(minZoom)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return parseResponse(apiAuthClient.avatar.$post({form: {avatar: file}}))
    },
    onSuccess: () => {
      toast.success('Avatar updated')
      setShowImage(true)
      setUserAvatarVersion(v => v + 1)
      clearPreview()
    },
    onError: error => {
      toast.error('Failed to upload avatar')
      setShowImage(false)

      // Server returned a non-2xx (oversized file, bad format, etc.) — surface
      // it via the toast above without logging; only log genuine client-side
      // exceptions (network failures, etc.).
      if (!(error instanceof DetailedError)) {
        logClientError({error, context: 'client:avatarUpload:exception'})
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return parseResponse(apiAuthClient.avatar.$delete())
    },
    onSuccess: () => {
      toast.success('Avatar removed')
      setShowImage(false)
      setUserAvatarVersion(v => v + 1)
    },
    onError: error => {
      toast.error('Failed to remove avatar')
      setShowImage(true)

      // Server-side throws bubble to hono:topLevel:exception; only log genuine
      // client-side exceptions here.
      if (!(error instanceof DetailedError)) {
        logClientError({error, context: 'client:avatarDelete:exception'})
      }
    },
  })

  useEffect(
    () => () => {
      if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    },
    [blobPreviewUrl]
  )

  const handleConfirm = async () => {
    const selectedFile = selectedFileRef.current
    if (!(blobPreviewUrl && croppedAreaPixels && selectedFile)) return
    try {
      const file = await renderCroppedFile(
        blobPreviewUrl,
        croppedAreaPixels,
        selectedFile.name
      )
      uploadMutation.mutate(file)
    } catch (error) {
      toast.error('Failed to process image')
      logClientError({error, context: 'client:avatarUpload:exception'})
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage
            src={showImage ? userAvatarUrl : undefined}
            alt={user.email}
            onLoadingStatusChange={setImageLoadingStatus}
          />
          <AvatarFallback className="text-lg uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-sm">
          <p className="font-medium">
            {user.name} {user.lastName}
          </p>
          <p className="flex text-muted-foreground">
            <span className="min-w-0 truncate">{emailName}</span>
            <span className="shrink-0">@{emailDomain}</span>
          </p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-2 text-sm">
        {imageLoadingStatus !== 'loaded' && (
          <>
            <Label htmlFor={avatarInputId}>Avatar</Label>
            <Input
              ref={fileInputRef}
              id={avatarInputId}
              type="file"
              accept="image/*"
              className="cursor-pointer"
              disabled={uploadMutation.isPending}
              onChange={event => {
                const file = event.target.files?.[0]
                if (!file) return
                if (file.size > maxAvatarUploadSize) {
                  toast.warning(
                    `File too large (max ${bytesToSize(maxAvatarUploadSize)})`
                  )
                  event.target.value = ''
                  return
                }
                if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
                setBlobPreviewUrl(URL.createObjectURL(file))
                selectedFileRef.current = file
                setCrop({x: 0, y: 0})
                setZoom(minZoom)
                setCroppedAreaPixels(null)
              }}
            />
          </>
        )}
        <p className="mb-0 text-muted-foreground text-xs">
          Images are resized to 128x128
        </p>
        <p className="text-muted-foreground text-xs">
          Maximum file upload size: {bytesToSize(maxAvatarUploadSize)}
        </p>
        {imageLoadingStatus === 'loaded' && (
          <LoadingButton
            type="button"
            variant="outline"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Remove avatar
          </LoadingButton>
        )}
      </div>

      <Dialog
        open={blobPreviewUrl !== null}
        onOpenChange={open => {
          if (!(open || uploadMutation.isPending)) clearPreview()
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={event => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
          onInteractOutside={event => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Crop avatar</DialogTitle>
            <DialogDescription>
              Drag to reposition, scroll or use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
            {blobPreviewUrl && (
              <Cropper
                image={blobPreviewUrl}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={maxZoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <ZoomOutIcon className="size-4 shrink-0 text-muted-foreground" />
            <Slider
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={[zoom]}
              onValueChange={value => setZoom(value[0] ?? minZoom)}
              aria-label="Zoom"
            />
            <ZoomInIcon className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearPreview}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <LoadingButton
              type="button"
              loading={uploadMutation.isPending}
              disabled={!croppedAreaPixels}
              onClick={handleConfirm}
            >
              Upload avatar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

async function renderCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  originalName: string
): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2d context')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/webp', 0.92)
  )
  if (!blob) throw new Error('Failed to encode cropped image')
  const baseName = originalName.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, {type: 'image/webp'})
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}
