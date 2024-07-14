import {test, expect} from '@playwright/test'

const apiUrlPrefix = 'http://localhost:8910/api/v1'

test.describe('Get skill by key', () => {
  test('should response one skill with status "success" when request GET /skills/:key', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )

    const resp = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(resp.ok()).toBeTruthy()
    expect(await resp.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: {
          key: 'python',
          name: 'Python',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.arrayContaining(['programming language', 'scripting']),
        },
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })

  test('should response status "error" with message "Skill not found" when request GET /skills/:key', async ({
    request,
  }) => {
    const resp = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(resp.status()).toEqual(404)
    expect(await resp.json()).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'Skill not found',
      })
    )
  })
})

test.describe('Get skills', () => {
  test('should response skills with status "success" when request GET /skills/:key', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )

    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'go',
          name: 'Go',
          description: 'Go is a statically typed, compiled programming language designed at Google.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg',
          tags: ['programming language', 'system']
        }
      }
    )

    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'nodejs',
          name: 'Node.js',
          description: 'Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside of a browser.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg',
          tags: ['runtime', 'javascript']
        }
      }
    )

    const resp = await request.get(apiUrlPrefix + '/skills')
  
    expect(resp.ok()).toBeTruthy()
    expect(await resp.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.arrayContaining([
          {
            key: 'python',
            name: 'Python',
            description: expect.any(String),
            logo: expect.any(String),
            tags: expect.arrayContaining(['programming language', 'scripting']),
          },
          {
            key: 'go',
            name: 'Go',
            description: expect.any(String),
            logo: expect.any(String),
            tags: ['programming language', 'system']
          },
          {
            key: 'nodejs',
            name: 'Node.js',
            description: expect.any(String),
            logo: expect.any(String),
            tags: ['runtime', 'javascript']
          }
        ])
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
    await request.delete(apiUrlPrefix + '/skills/go')
    await request.delete(apiUrlPrefix + '/skills/nodejs')
  })

  test('should response empty list with status "success" when request GET /skills/:key', async ({
    request,
  }) => {
    const resp = await request.get(apiUrlPrefix + '/skills')
  
    expect(resp.ok()).toBeTruthy()
    expect(await resp.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.arrayContaining([])
      })
    )
  })
})

test.describe('Create skill', () => {
  test('should response new skill with status "success" when request POST /skills', async ({
    request,
  }) => {
    const getResponseBefore = await request.get(apiUrlPrefix + '/skills')
  
    expect(getResponseBefore.ok()).toBeTruthy()
    expect(await getResponseBefore.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.arrayContaining([])
      })
    )

    const postResponse = await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )

    expect(postResponse.ok()).toBeTruthy()
    expect(await postResponse.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: {
          key: 'python',
          name: 'Python',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.arrayContaining(['programming language', 'scripting']),
        },
      })
    )

    const getResponseAfter = await request.get(apiUrlPrefix + '/skills')
  
    expect(getResponseAfter.ok()).toBeTruthy()
    expect(await getResponseAfter.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.arrayContaining([
          {
            key: 'python',
            name: 'Python',
            description: expect.any(String),
            logo: expect.any(String),
            tags: expect.arrayContaining(['programming language', 'scripting']),
          }
        ])
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })

  test('should response status "error" with message "Skill already exists" when request POST /skills', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )

    const postResponse = await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python3',
          description: 'Python3 is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language']
        }
      }
    )
  
    expect(postResponse.status()).toEqual(409)
    expect(await postResponse.json()).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'Skill already exists',
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })
})

test.describe('Update skill', () => {
  test('should response updated skill with status "success" when request PUT /skills/:key', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )
    
    const getResponseBefore = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseBefore.ok()).toBeTruthy()
    expect(await getResponseBefore.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: 'Python',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.arrayContaining(['programming language', 'scripting']),
        })
      })
    )

    const updateResponse = await request.put(apiUrlPrefix + '/skills/python',
      {
        data: {
          name: 'Python 3',
          description: 'Python 3 is the latest version of Python programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['data'],
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: {
          key: 'python',
          name: 'Python 3',
          description: 'Python 3 is the latest version of Python programming language.',
          logo: expect.any(String),
          tags: expect.arrayContaining(['data']),
        },
      })
    )

    const getResponseAfter = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseAfter.ok()).toBeTruthy()
    expect(await getResponseAfter.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: 'Python 3',
          description: 'Python 3 is the latest version of Python programming language.',
          logo: expect.any(String),
          tags: expect.arrayContaining(['data']),
        })
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })

  test('should response status "error" with message "not be able to update skill" when request PUT /skills/:key', async ({
    request,
  }) => {
    const updateResponse = await request.put(apiUrlPrefix + '/skills/python',
      {
        data: {
          name: 'Python 3',
          description: 'Python 3 is the latest version of Python programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['data'],
        }
      }
    )

    expect(updateResponse.status()).toEqual(400)
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'not be able to update skill',
      })
    )
  })
})

test.describe('Update skill name', () => {
  test('should response updated skill name with status "success" when request PUT /skills/:key/actions/name', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )
    
    const getResponseBefore = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseBefore.ok()).toBeTruthy()
    expect(await getResponseBefore.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: 'Python',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.arrayContaining(['programming language', 'scripting']),
        })
      })
    )

    const updateResponse = await request.patch(apiUrlPrefix + '/skills/python/actions/name',
      {
        data: {
          name: 'Python 3',
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: {
          key: 'python',
          name: 'Python 3',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.any(Array),
        },
      })
    )

    const getResponseAfter = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseAfter.ok()).toBeTruthy()
    expect(await getResponseAfter.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: 'Python 3',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.any(Array),
        })
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })

  test('should response status "error" with message "not be able to update skill name" when request PUT /skills/:key/actions/name', async ({
    request,
  }) => {
    const updateResponse = await request.patch(apiUrlPrefix + '/skills/python/actions/name',
      {
        data: {
          name: 'Python 3',
        }
      }
    )

    expect(updateResponse.status()).toEqual(400)
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'not be able to update skill name',
      })
    )
  })
})

test.describe('Update skill description', () => {
  test('should response updated skill description with status "success" when request PUT /skills/:key/actions/description', async ({
    request,
  }) => {
    await request.post(apiUrlPrefix + '/skills',
      {
        data: {
          key: 'python',
          name: 'Python',
          description: 'Python is an interpreted, high-level, general-purpose programming language.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
          tags: ['programming language', 'scripting']
        }
      }
    )
    
    const getResponseBefore = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseBefore.ok()).toBeTruthy()
    expect(await getResponseBefore.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: 'Python',
          description: expect.any(String),
          logo: expect.any(String),
          tags: expect.arrayContaining(['programming language', 'scripting']),
        })
      })
    )

    const updateResponse = await request.patch(apiUrlPrefix + '/skills/python/actions/description',
      {
        data: {
          description: 'Python 3 is the latest version of Python programming language.',
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: {
          key: 'python',
          name: expect.any(String),
          description: 'Python 3 is the latest version of Python programming language.',
          logo: expect.any(String),
          tags: expect.any(Array),
        },
      })
    )

    const getResponseAfter = await request.get(apiUrlPrefix + '/skills/python')
  
    expect(getResponseAfter.ok()).toBeTruthy()
    expect(await getResponseAfter.json()).toEqual(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          key: 'python',
          name: expect.any(String),
          description: 'Python 3 is the latest version of Python programming language.',
          logo: expect.any(String),
          tags: expect.any(Array),
        })
      })
    )

    await request.delete(apiUrlPrefix + '/skills/python')
  })
})