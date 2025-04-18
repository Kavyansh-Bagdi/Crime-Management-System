'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function MaintenanceError() {
  const router = useRouter()

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] font-bold leading-tight'>503</h1>
        <span className='font-medium'>Website is under maintenance!</span>
        <p className='text-center text-muted-foreground'>
          The site is not available at the moment. <br />
          We'll be back online shortly.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => router.push('/status')}>
            Learn more
          </Button>
        </div>
      </div>
    </div>
  )
}
