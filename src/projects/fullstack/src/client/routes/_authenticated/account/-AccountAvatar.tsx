import type {ImageLoadingStatus} from '@/client/components/ui/avatar'

import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Input} from '@/client/components/ui/input'
import {Label} from '@/client/components/ui/label'
import {Separator} from '@/client/components/ui/separator'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {
  apiAuthClientAtom,
  userAvatarVersionAtom,
  userInitialsAtom,
} from '@/client/state/globalState'
import {authRoutePath, maxAvatarUploadSize} from '@/shared/constants'

import {bytesToSize} from '@qodestack/utils'
import {useMutation} from '@tanstack/react-query'
import {useRouteContext} from '@tanstack/react-router'
import {DetailedError, parseResponse} from 'hono/client'
import {useAtom, useAtomValue} from 'jotai'
import {useEffect, useId, useRef, useState} from 'react'
import {toast} from 'sonner'

export function AccountAvatar() {
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })
  const initials = useAtomValue(userInitialsAtom)

  const [showImage, setShowImage] = useState(true)
  const [imageLoadingStatus, setImageLoadingStatus] =
    useState<ImageLoadingStatus>('idle')
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputId = useId()
  const apiAuthClient = useAtomValue(apiAuthClientAtom)
  const logClientError = useLogClientError()
  const [userAvatarVersion, setUserAvatarVersion] = useAtom(
    userAvatarVersionAtom
  )

  const clearPreview = () => {
    if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    setBlobPreviewUrl(null)
    setSelectedFile(null)
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

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-full">
          <AvatarImage
            src={
              blobPreviewUrl ??
              (showImage
                ? `${authRoutePath}/avatar?=${userAvatarVersion}`
                : undefined)
            }
            alt={user.email}
            onLoadingStatusChange={status => {
              if (!blobPreviewUrl) setImageLoadingStatus(status)
            }}
          />
          <AvatarFallback className="rounded-lg font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium">
            {user.name} {user.lastName}
          </p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-2 text-sm">
        {imageLoadingStatus !== 'loaded' && !blobPreviewUrl && (
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
                setSelectedFile(file)
              }}
            />
          </>
        )}
        <p className="mb-0 text-muted-foreground text-xs">
          Images are resized to 128x128 and converted to WebP.
        </p>
        <p className="text-muted-foreground text-xs">
          Maximum file upload size: {bytesToSize(maxAvatarUploadSize)}
        </p>
        {uploadMutation.isPending && (
          <p className="text-muted-foreground text-xs">Uploading...</p>
        )}
        {blobPreviewUrl && (
          <div className="flex gap-2">
            <LoadingButton
              type="button"
              size="sm"
              loading={uploadMutation.isPending}
              onClick={() => {
                if (selectedFile) uploadMutation.mutate(selectedFile)
              }}
            >
              Upload avatar
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              size="sm"
              loading={uploadMutation.isPending}
              onClick={clearPreview}
            >
              Clear avatar
            </LoadingButton>
          </div>
        )}
        {imageLoadingStatus === 'loaded' && !blobPreviewUrl && (
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
    </>
  )
}
