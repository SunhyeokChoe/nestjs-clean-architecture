import { Code } from '@core/common/code/Code'
import { PostStatus } from '@core/common/enums/PostEnums'
import { UserRole } from '@core/common/enums/UserEnums'
import { Post } from '@core/domain/post/entity/Post'
import { User } from '@core/domain/user/entity/User'
import { HttpStatus } from '@nestjs/common'
import { TestServer } from '@test/.common/TestServer'
import { AuthExpect } from '@test/e2e/expect/AuthExpect'
import { ResponseExpect } from '@test/e2e/expect/ResponseExpect'
import { AuthFixture } from '@test/e2e/fixture/AuthFixture'
import { PostFixture } from '@test/e2e/fixture/PostFixture'
import { UserFixture } from '@test/e2e/fixture/UserFixture'
import * as supertest from 'supertest'
import { v4 } from 'uuid'
import { PostUseCaseDto } from '@core/domain/post/usecase/dto/PostUseCaseDto'

describe('Post.GetCommonList', () => {
  
  let testServer: TestServer
  let userFixture: UserFixture
  let postFixture: PostFixture
  
  beforeAll(async () => {
    testServer = await TestServer.new()
    
    userFixture = UserFixture.new(testServer.testingModule)
    postFixture = PostFixture.new(testServer.testingModule)
    
    await testServer.serverApplication.init()
  })
  
  afterAll(async () => {
    if (testServer) {
      await testServer.serverApplication.close()
    }
  })
  
  describe('GET /posts', () => {
  
    test('When author requests common post list, expect it returns list with only published posts', async () => {
      await expectItReturnsListWithPublishedPosts(UserRole.AUTHOR, testServer, userFixture, postFixture)
    })
  
    test('When admin requests common post list, expect it returns list with only published posts', async () => {
      await expectItReturnsListWithPublishedPosts(UserRole.ADMIN, testServer, userFixture, postFixture)
    })
  
    test('When guest requests common post list, expect it returns list with only published posts', async () => {
      await expectItReturnsListWithPublishedPosts(UserRole.GUEST, testServer, userFixture, postFixture)
    })
    
    test('When access token is not passed, expect it returns "UNAUTHORIZED_ERROR" response', async () => {
      await AuthExpect.unauthorizedError({method: 'get', path: '/posts'}, testServer)
    })
    
    test('When access token is not valid, expect it returns "UNAUTHORIZED_ERROR" response', async () => {
      await AuthExpect.unauthorizedError({method: 'get', path: '/posts'}, testServer, v4())
    })
    
  })
  
})

async function expectItReturnsListWithPublishedPosts(
  executorRole: UserRole,
  testServer: TestServer,
  userFixture: UserFixture,
  postFixture: PostFixture,

): Promise<void> {
  
  const executor: User = await userFixture.insertUser({role: executorRole, email: `${v4()}@email.com`, password: v4()})
  const otherUser: User = await userFixture.insertUser({role: executorRole, email: `${v4()}@email.com`, password: v4()})
  
  const {accessToken} = await AuthFixture.loginUser({id: executor.getId()})
  
  const executorDraftPost: Post = await postFixture.insertPost({owner: executor, status: PostStatus.DRAFT, withImage: false})
  const executorPublishedPost: Post = await postFixture.insertPost({owner: executor, status: PostStatus.PUBLISHED, withImage: false})
  
  const otherUserDraftPost: Post = await postFixture.insertPost({owner: otherUser, status: PostStatus.DRAFT, withImage: false})
  const otherUserPublishedPost: Post = await postFixture.insertPost({owner: otherUser, status: PostStatus.PUBLISHED, withImage: false})
  
  const response: supertest.Response = await supertest(testServer.serverApplication.getHttpServer())
    .get('/posts')
    .set('x-api-token', accessToken)
    .expect(HttpStatus.OK)
  
  const expectedPostList: Array<Record<string, unknown>> = [
    buildExpectedPostDto(executorPublishedPost, executor),
    buildExpectedPostDto(otherUserPublishedPost, otherUser),
  ]
  
  const notExpectedPostList: Array<Record<string, unknown>> = [
    buildExpectedPostDto(executorDraftPost, executor),
    buildExpectedPostDto(otherUserDraftPost, otherUser),
  ]
  
  const authorIds: string[] = [executor.getId(), otherUser.getId()]
  const receivedPostList: PostUseCaseDto[] = response.body.data.filter((item: PostUseCaseDto) => authorIds.includes(item.owner.id))
  
  ResponseExpect.codeAndMessage(response.body, {code: Code.SUCCESS.code, message: Code.SUCCESS.message})
  
  expect(receivedPostList.length).toBe(expectedPostList.length)
  expect(receivedPostList).toEqual(expect.arrayContaining(expectedPostList))
  expect(receivedPostList).toEqual(expect.not.arrayContaining(notExpectedPostList))
}

function buildExpectedPostDto(post: Post, owner: User): Record<string, unknown> {
  return {
    id         : post!.getId(),
    owner      : PostFixture.userToPostOwner(owner),
    image      : null,
    title      : post.getTitle(),
    content    : post.getContent(),
    status     : post.getStatus(),
    createdAt  : post!.getCreatedAt().getTime(),
    editedAt   : post?.getEditedAt()?.getTime() || null,
    publishedAt: post?.getPublishedAt()?.getTime() || null,
  }
}